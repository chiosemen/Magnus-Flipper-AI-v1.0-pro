// Ultimate diagnostic - no dependencies
module.exports = (req, res) => {
  try {
    // Test if we can even access basic Node.js features
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      message: 'Vercel function execution successful',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasExpress: (() => {
          try {
            require.resolve('express');
            return true;
          } catch {
            return false;
          }
        })()
      }
    }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: error.message,
      stack: error.stack
    }));
  }
};
