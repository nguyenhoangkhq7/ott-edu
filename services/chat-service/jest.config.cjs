module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Bí kíp: Ép TypeScript biên dịch ngầm sang CommonJS cho Jest dễ đọc
        tsconfig: {
          module: 'CommonJS',
        },
      },
    ],
  },
  moduleNameMapper: {
    // Tự động xử lý các đường dẫn import có đuôi .js hoặc .ts trong code của ông
    '^(\\.{1,2}/.*)\\.(js|ts)$': '$1',
  },
  // Bê 3 dòng của team vào đây để CI chịu nhả Tick Xanh:
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};