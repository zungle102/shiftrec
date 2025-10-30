module.exports = {
	root: true,
	ignorePatterns: ['dist', '.next', 'node_modules'],
	overrides: [
		{
			files: ['apps/web/**/*.{ts,tsx}'],
			extends: ['next', 'next/core-web-vitals'],
			parserOptions: { project: null }
		},
		{
			files: ['apps/api/**/*.ts'],
			extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint'],
			rules: {}
		},
		{
			files: ['packages/shared/**/*.ts'],
			extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint']
		}
	]
}

