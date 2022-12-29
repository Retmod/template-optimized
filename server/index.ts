import express from 'express';
import path from 'path';
import chalk from 'chalk';
import mongoose from 'mongoose';
const app = express();
import { version } from './package.json';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';

// DATABASE
const MongoDBConfig: {
    ip: string;
    port: string;
    db: string;
    username: string;
    password: string;
} = {
    db: 'main',
    ip: '0.0.0.0',
    port: '27017',
    password: 'passwd',
    username: 'user',
};

mongoose
    .connect(
        `mongodb://${MongoDBConfig.username}:${MongoDBConfig.password}@${MongoDBConfig.ip}:${MongoDBConfig.port}`,
        {
            dbName: MongoDBConfig.db,
        }
    )
    .then(() => {
        console.log(chalk.blue('[DATABASE]: Connected!'));
    });

// FILE SERVING
const builddir = path.join(__dirname, '..', 'client', 'build');

// cuz for some reason, webpack puts a .png file that exports the real file path instead of just putting the file there... idk how to fix
app.use(async (req, res, next) => {
    if (req.url.includes('..')) return next();

    const filePath = path.join(builddir, req.url);
    try {
        await access(filePath, constants.R_OK);

        let isImage = false;
        for (const extension of imageExtensions)
            isImage = isImage || filePath.endsWith(extension);
        if (!isImage) return next();

        const contents = (await readFile(filePath)).toString();

        if (
            contents.startsWith('export default __webpack_public_path__ + "') &&
            contents.endsWith('";')
        )
            return res.sendFile(
                path.join(builddir, contents.substring(42, contents.length - 2))
            );
        return res.sendFile(filePath);
    } catch {
        return next();
    }
    return next();
});
app.use(express.static('public'));

// API

app.get('/api/version', (req, res) => {
    if (req.query.json !== undefined) res.json(version);
    else res.send(version);
});

// FILE SERVING
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(3000, () => {
    console.log(chalk.green(`[SERVER]: Listening on port 3000`));
});

const imageExtensions = [
    '.png',
    '.ttf',
    '.svg',
    '.gif',
    '.webp',
    '.jpg',
    '.jpeg',
];
