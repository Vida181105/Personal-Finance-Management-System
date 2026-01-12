const app = require('./app');

app.listen(8888, () => {
  console.log(`Server running on port 8888`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
