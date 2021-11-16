const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
require('dotenv').config();

const WooCommerce = new WooCommerceRestApi({
  url: process.env.DEVORIGIN,
  consumerKey: process.env.DEVCONSUMERKEY,
  consumerSecret: process.env.DEVCONSUMERSECRET,
  version: 'wc/v3',
  queryStringAuth: true 
});

module.exports = WooCommerce;