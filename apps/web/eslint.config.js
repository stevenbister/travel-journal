import { config as reactConfig } from '@repo/eslint-config/react-internal';
import pluginQuery from '@tanstack/eslint-plugin-query';
import { globalIgnores } from 'eslint/config';

/** @type {import("eslint").Linter.Config[]} */
export default [
    ...reactConfig,
    ...pluginQuery.configs['flat/recommended'],
    globalIgnores(['*.d.ts']),
];
