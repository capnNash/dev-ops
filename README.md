
## aws 
all the cloudformation templates, and cloudfoundation projects used to generate the cloudformation templates


## circleci 
so far, just a single Dockerfile used to build the customized container used in our circleci projects that need to interact with ClearBlade. 


## DockerDev

in DockerDev directory,  build and tag the dockerfile like so: 
docker build --no-cache -t iotrightdev:latest .