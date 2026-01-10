// Configure ts-node to use CommonJS
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

// Enable path aliases
require("tsconfig-paths/register");

// Run the seed
require("./seed.ts");

