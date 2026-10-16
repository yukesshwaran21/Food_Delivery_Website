import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(scriptDirectory, '..');
const projectDirectory = path.resolve(backendDirectory, '..');
const routesDirectory = path.join(backendDirectory, 'routes');
const outputPath = path.join(projectDirectory, 'docs', 'API.md');

const mountPoints = {
    cartRouter: '/api/cart',
    contactRouter: '/api/contact',
    foodRouter: '/api/food',
    notificationRouter: '/api/notification',
    orderRouter: '/api/order',
    reportRouter: '/api/report',
    userRouter: '/api/user',
};

const routePattern = /(\w+)\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\3\s*,/gi;

function normalizePath(pathValue) {
    if (pathValue === '/') return '';
    return pathValue.startsWith('/') ? pathValue : `/${pathValue}`;
}

function formatPath(mountPoint, routePath) {
    return `${mountPoint}${normalizePath(routePath) || '/'}`;
}

function routeDetails(match, sourceFile, contents) {
    const [, routerName, method, , routePath] = match;
    const mountPoint = mountPoints[routerName];

    if (!mountPoint) return null;

    const routeContext = contents.slice(match.index, match.index + 500);
    return {
        method: method.toUpperCase(),
        path: formatPath(mountPoint, routePath),
        authentication: routeContext.includes('authMiddleware') ? 'Required' : 'Not indicated',
        source: `backend/routes/${sourceFile}`,
        upload: routeContext.includes('upload') || routeContext.includes('multer') ? 'Yes' : 'No',
    };
}

async function readRoutes() {
    const files = (await fs.readdir(routesDirectory))
        .filter((fileName) => fileName.endsWith('.js'))
        .sort();
    const routes = [];

    for (const fileName of files) {
        const contents = await fs.readFile(path.join(routesDirectory, fileName), 'utf8');
        for (const match of contents.matchAll(routePattern)) {
            const route = routeDetails(match, fileName, contents);
            if (route) routes.push(route);
        }
    }

    return routes.sort((first, second) =>
        first.path.localeCompare(second.path) || first.method.localeCompare(second.method)
    );
}

function renderDocumentation(routes) {
    const rows = routes.map((route) =>
        `| \`${route.method}\` | \`${route.path}\` | ${route.authentication} | ${route.upload} | \`${route.source}\` |`
    );

    return `# API Documentation

This endpoint inventory is generated from the Express route definitions in
\`backend/routes/\`. Do not edit the endpoint table manually.

## Base URL

- Local development: \`http://localhost:4000\`
- Production: configure the deployed backend URL for the environment.

## Authentication

Authenticated endpoints expect the JWT in the \`token\` request header. The
backend's \`authMiddleware\` validates this token and provides the authenticated
user ID to the controller.

## Endpoints

| Method | Path | Authentication | File upload | Route definition |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Keeping this documentation current

When adding or changing an Express route:

1. Update the route file in \`backend/routes/\`.
2. Run \`npm run docs:api\` from \`backend/\`.
3. Review the generated table and commit \`docs/API.md\`.

CI runs \`npm run docs:api:check\` and fails when this file is out of date.
`;
}

const checkOnly = process.argv.includes('--check');
const documentation = renderDocumentation(await readRoutes());

if (checkOnly) {
    let currentDocumentation;
    try {
        currentDocumentation = await fs.readFile(outputPath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('docs/API.md is missing. Run npm run docs:api.');
            process.exitCode = 1;
        } else {
            throw error;
        }
    }

    if (currentDocumentation !== documentation) {
        console.error('docs/API.md is out of date. Run npm run docs:api.');
        process.exitCode = 1;
    }
} else {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, documentation);
    console.log(`Generated ${path.relative(projectDirectory, outputPath)}`);
}
