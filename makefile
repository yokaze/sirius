default:
	electron-packager source/ Sirius --platform=darwin --arch=x64 --electron-version=1.8.8 --asar --overwrite

run:
	npx electron ./source

lint:
	cd source; eslint . --ext .js --ext .jsx

update:
	cd source; npm update
