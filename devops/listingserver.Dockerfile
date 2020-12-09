FROM node:10-alpine

WORKDIR /main
COPY ./back_end/listingserver.js /main
COPY ./back_end/package.json /main
COPY ./back_end/package-lock.json /main

RUN npm install

EXPOSE 5000

CMD ["node", "listingserver.js"]