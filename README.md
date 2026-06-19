{
  "name": "tennis-traveler",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "stripe": "^16.0.0"
  }
}

[build]
  publish = "."
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
