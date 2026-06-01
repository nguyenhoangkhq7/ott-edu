const bcrypt = require('bcryptjs');
const hash = '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m';
console.log('password:', bcrypt.compareSync('password', hash));
console.log('admin:', bcrypt.compareSync('admin', hash));
console.log('123456:', bcrypt.compareSync('123456', hash));
console.log('12345678:', bcrypt.compareSync('12345678', hash));
console.log('Password@123:', bcrypt.compareSync('Password@123', hash));
