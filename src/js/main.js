/* 
  ie不支持 Object.assign 方法 。Babel仅转化ES6的基础语法，但没有转化新的API 
  
  gulp中的解决方法：<head> 引入 <script src="js/polyfill.min.js"></script>
*/
function main() {
  let say = "gulp";
  let stu = { name: 'cjn' };
  let person = Object.assign(stu, { age: '24' }); // Object.assign()
  console.log(`hello ${say}`);
  console.log(person.age);
}

main();