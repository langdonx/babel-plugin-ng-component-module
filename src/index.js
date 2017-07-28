const fs = require('fs');
const path = require('path');

module.exports = ({ types }) => ({
    visitor: {
        Program(programPath, state) {
            const directiveIndex = programPath.node.directives.findIndex(d => d.value.value === 'ngComponentModule');

            // if the ngComponentModule directive is being used
            if (directiveIndex > -1) {
                // remove the directive from the source
                programPath.node.directives.splice(directiveIndex, 1);

                // iterate sub-directories to build a list of necessary imports
                const components = [];
                const componentRootDir = path.dirname(state.file.opts.filename);

                fs.readdirSync(componentRootDir)
                    .filter(name => fs.statSync(path.join(componentRootDir, name)).isDirectory())
                    .forEach((componentSubDir) => {
                        const name = path.basename(componentSubDir);

                        if (fs.existsSync(path.join(componentRootDir, componentSubDir, 'index.js')) === true) {
                            components.push({ name, path: `./${name}` });
                        }
                        else if (fs.existsSync(path.join(componentRootDir, componentSubDir, `${name}.js`)) === true) {
                            components.push({ name, path: `./${name}/${name}` });
                        }
                        else if (fs.existsSync(path.join(componentRootDir, componentSubDir, `${name}.component.js`)) === true) {
                            components.push({ name, path: `./${name}/${name}.component` });
                        }
                        else if (fs.existsSync(path.join(componentRootDir, componentSubDir, `${name}.directive.js`)) === true) {
                            components.push({ name, path: `./${name}/${name}.directive`, isDirective: true });
                        }
                        else {
                            console.warn('[babel-plugin-ng-component-module WARNING] Skipping module directory, cannot find appropriately named default file', componentSubDir);
                        }
                    });

                // create code!
                const componentRootDirName = path.basename(componentRootDir).replace(/-([a-z])/g, s => s[1].toUpperCase());
                const moduleVar = `${componentRootDirName}Module`;

                // create import statements for each component
                components.forEach((component) => {
                    programPath.pushContainer(
                        'body',
                        types.importDeclaration(
                            [
                                types.importDefaultSpecifier(
                                    types.identifier(component.name)
                                ),
                            ],
                            types.stringLiteral(component.path)
                        )
                    );
                });

                // create an angular module
                programPath.pushContainer(
                    'body',
                    types.variableDeclaration(
                        'const', [
                            types.VariableDeclarator(
                                types.identifier(moduleVar),
                                types.callExpression(
                                    types.memberExpression(
                                        types.identifier('angular'),
                                        types.identifier('module'),
                                        false
                                    ), [
                                        types.stringLiteral(`app.${componentRootDirName}`),
                                        types.arrayExpression(),
                                    ]
                                )
                            ),
                        ]
                    )
                );

                // create angular components for each component
                components.forEach((component) => {
                    if (component.isDirective === true) {
                        programPath.pushContainer(
                            'body',
                            types.callExpression(
                                types.memberExpression(
                                    types.identifier(moduleVar),
                                    types.identifier('directive')
                                ), [
                                    types.memberExpression(
                                        types.identifier(component.name),
                                        types.identifier('name')
                                    ),
                                    types.memberExpression(
                                        types.identifier(component.name),
                                        types.identifier('directive')
                                    ),
                                ]
                            )
                        );
                    }
                    else {
                        programPath.pushContainer(
                            'body',
                            types.callExpression(
                                types.memberExpression(
                                    types.identifier(moduleVar),
                                    types.identifier('component')
                                ), [
                                    types.memberExpression(
                                        types.identifier(component.name),
                                        types.identifier('name')
                                    ),
                                    types.identifier(component.name),
                                ]
                            )
                        );
                    }
                });
            }
        },
    },
});
