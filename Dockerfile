FROM node:6

# Move to working location
WORKDIR /usr/src/app 

# Copy the app dependencies
COPY package*.json ./ 

# Install dependencies 
RUN npm install 

# Copy the other contents
COPY . . 

# Run the build using make 
RUN make 


# Host site using updated node version
FROM node:16

# Move to app 
WORKDIR /usr/src/app

# Copy over the build files 
COPY --from=0 /usr/src/app ./

# Expose the port 
EXPOSE 8080

# Install server dependencies 
RUN npm install http-server -g 

# Run the server 
CMD ["http-server","-p", "8080", "--cors"]
