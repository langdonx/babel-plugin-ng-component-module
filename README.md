# About

I don't really want to write `import`, `export`, `angular.module`, and `angular.component` statements all day long. This plugin automatically generates those statements after inspecting the filesystem at compile time.

It's being used in my [angular-2017-starter repo](https://github.com/langdonx/angularjs-2017-starter), where my components directory contains logically grouped components together that are lazy loaded on demand at runtime.

Given the following directory structure:

    src/components/todo/
    -------------------/index.js
    -------------------/todo/
    ------------------------/todo.html
    ------------------------/todo.js
    ------------------------/todo.scss
    src/components/todo/todo-list/
    -----------------------------/todo-list.html
    -----------------------------/todo-list.js
    -----------------------------/todo-list.scss

Using `'ngComponentModule'` inside `todo/index.js` will generate the following code prior to compilation:

    import todo from './todo/todo'
    import todoList from './todo-list/todo-list'
    var todoModule = angular.module('app.todo', [])
	todoModule.component(todo.name, todo)
	todoModule.component(todoList.name, todoList)

# To Do
- Add some elaborate integration test
- Allow for root namespace to be configured (perhaps `'ngModelComponent:app'`)
- Maybe allow a comment (`/* ngComponentModule */`) in lieu of a directive
- Maybe figure out how to add semicolons even though they're not necessary
- Maybe figure out how to chain `.component()` calls off of `.module()` (hint: loop)

# Note
 - https://docs.npmjs.com/getting-started/publishing-npm-packages
