default:
	cd source; npx electron-packager . Sirius --out=../ --platform=darwin --arch=x64 --electron-version=1.8.8 --asar --overwrite

run:
	cd source; npx electron .

test:
	cd source; npx mocha --require babel-register

lint:
	cd source; npx eslint . --ext .js --ext .jsx

analyze:
	cd source; cloc . --exclude-dir=node_modules --exclude-ext=json

setup:
	cd source; npm install

update:
	cd source; npm update
