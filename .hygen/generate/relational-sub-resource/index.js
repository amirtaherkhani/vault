const normalizeSubPath = (input) => {
  const value = String(input ?? '').trim();

  if (!value) {
    return '';
  }

  return value
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/^src\/?/, '');
};

const buildPromptResult = ({ name, subPath }) => {
  const normalizedName = String(name ?? '').trim();
  const normalizedSubPath = normalizeSubPath(subPath);
  const subPathDepth = normalizedSubPath
    ? normalizedSubPath.split('/').filter(Boolean).length
    : 0;

  return {
    name: normalizedName,
    subPath: normalizedSubPath,
    subPathPrefix: normalizedSubPath ? `${normalizedSubPath}/` : '',
    resourceRoot: normalizedSubPath ? `src/${normalizedSubPath}` : 'src',
    fromResourceToSrc: '../'.repeat(subPathDepth + 1),
    fromPersistenceToSrc: '../'.repeat(subPathDepth + 3),
    fromRelationalToSrc: '../'.repeat(subPathDepth + 5),
  };
};

module.exports = {
  prompt: async ({ prompter, args }) => {
    if (Object.keys(args).length) {
      return Promise.resolve(
        buildPromptResult({
          name: args.name,
          subPath: args.subPath,
        }),
      );
    }

    const { name } = await prompter.prompt({
      type: 'input',
      name: 'name',
      message: "Resource name (e.g. 'User')",
      validate: (input) => {
        if (!input.trim()) {
          return 'Resource name is required';
        }

        return true;
      },
      format: (input) => {
        return input.trim();
      },
    });

    const { subPath } = await prompter.prompt({
      type: 'input',
      name: 'subPath',
      message: "Sub path under src (optional, e.g. 'providers/striga')",
      initial: '',
      format: normalizeSubPath,
    });

    return buildPromptResult({
      name,
      subPath,
    });
  },
};
