build:
	docker build -t talktochatgpt .

run:
	docker run -d -p 3000:3000 --name talktochatgpt --rm talktochatgpt