import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  build:{
    target: "es2022",
  },
  plugins: [wasm()]
});
