FROM node:18
ARG REACT_APP_GRAPHQL_ENDPOINT
ARG REACT_APP_REGISTER_ENDPOINT
ARG REACT_APP_LOGIN_ENDPOINT

ENV REACT_APP_GRAPHQL_ENDPOINT=$REACT_APP_GRAPHQL_ENDPOINT
ENV REACT_APP_REGISTER_ENDPOINT=$REACT_APP_REGISTER_ENDPOINT
ENV REACT_APP_LOGIN_ENDPOINT=$REACT_APP_LOGIN_ENDPOINT

WORKDIR /usr/src/front

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

RUN npm install -g serve
RUN npm run build

CMD ["serve", "-s",  "build", "-l","3001"] 

