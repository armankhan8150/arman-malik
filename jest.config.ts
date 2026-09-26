import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);

const paths =
  tsconfig?.compilerOptions?.paths ?? {};

const pathMappings = pathsToModuleNameMapper(
  paths,
  {
    prefix: '<rootDir>/',
  },
);

const config: Config = {
  moduleFileExtensions: [
    'js',
    'json',
    'ts',
  ],

  rootDir: '.',

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    ...pathMappings,
  },

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],

  coverageDirectory: './coverage',

  testEnvironment: 'node',
};

export default config;