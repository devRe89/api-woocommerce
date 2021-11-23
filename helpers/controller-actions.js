const WooCommerce = require('../config-wc/wc');


const getAllProducts = async skus => {

    if ( skus.length ) {
        const allPromises = skus.map(sku => {
            const response = WooCommerce.get(`products/?sku=${sku}`);
            return response;
        });
        if ( allPromises.length ) {
            const resultPromises = await Promise.all(allPromises);
            if ( resultPromises ) {
                const productsWc = resultPromises.map(response => {
                    if ( response.status === 200 && response.data.length ) {
                        return response.data;
                    }
                })
                return productsWc.reduce((acc, el) => acc.concat(el), []);
            }
        }
    }
    return [];
    
}

const getAllProductsPromises = async skus => {

  if ( skus.length ) {
      const allPromises = skus.map(sku => {
          const response =  WooCommerce.get(`products/?sku=${sku}`);
          return response;
      });
      return allPromises;
  }
  return [];
  
}

const getOnePromisesProduct = sku => {
    const response = WooCommerce.get(`products/?sku=${sku}`);
    return response;
}

const getDataPromisesForSlice = async array => {

  if ( array.length ){
    const result = [];
    const arrayLength = array.length
    for (let index = 0; index <= arrayLength; index += 10) {
      const requestLote = array.slice(index, index + 10).map(item => {
        return getOnePromisesProduct(item);
      });
      if ( index >= 10 ) {
        setTimeout(() => {
          console.log('current index: ', index);
        }, 4000)
      };
      const resAllPromisesLote = await Promise.all(requestLote);
      result.push(resAllPromisesLote);
    }
    return result.reduce((acc, el) => acc.concat(el), []);
  }
  return [];

}

const insertAllAttrs = async (data, dataIndex) => {

    const allPromises = data.map(attr => {
      const attribute = {
          name: attr,
          slug: `pa_${attr.toLowerCase()}`,
          type: 'select',
          order_by: 'menu_order',
          has_archives: true
      }
      return WooCommerce.post("products/attributes", attribute);
    });

    if ( allPromises.length ) {
      const resultPromises = await Promise.all(allPromises);
      if ( resultPromises ) {
        resultPromises.map(response => {
            if ( response.status === 201 ) {
              const { id, name } = response.data;
              dataIndex[name] = id;
            }
        });
        return dataIndex;
      }
    }

    return dataIndex;
}

const prepareAllInsert = async (id, data) => {
    const response = WooCommerce.put(`products/${id}`, data);
    return response;
}

const jsonAttr = (obj, sku, indexAllAttrsWc, indexSkuCsv) => Object.keys(obj).map((o, pos) => {
  if ( indexAllAttrsWc[o] ){
      return {
          id: indexAllAttrsWc[o],
          position: pos + 1,
          name: o,
          options: indexSkuCsv[sku][o],
          visible: true,
          variation: false,
      }
  }
});

const getAllAttributes = async () => {

  const response = await WooCommerce.get("products/attributes");
  if ( response.status === 200 ) {
      return response.data;
  }
  return [];

}

const filterValues = (array, key) => {

  const result = array.map(item => item[key]).filter((value, index, self) => self.indexOf(value) === index);
  return result;

}


const indexByItem = (array, key, index) => array.reduce((acc, el) =>{

  if(!acc[el[key]]){
      acc[el[key]] = [];
      acc[el[key]].push(el[index]);
  }else{
      acc[el[key]].push(el[index]);
  }
  return acc;

}, {});



const indexBySku = (array) => array.reduce((acc, el) =>{
    
  if(!acc[el['sku']]){
      acc[el['sku']] = [];
      acc[el['sku']].push({
        atributo: el['atributo'],
        valores: el['valores']
      });
  }else{
      acc[el['sku']].push({
        atributo: el['atributo'],
        valores: el['valores']
      });
  }
  return acc;

}, {});

const groupBy = (list, prop) => {

  return list.reduce((groupped, item) => {
    let key = item[prop];
    delete item[prop];
    if (groupped.hasOwnProperty(key)) {
      groupped[key].push(item);
    } else {
      groupped[key] = [item];
    }
    return groupped
  }, {});

}
  
const groupSubKeys = (obj, properties, propIndex) => {

  let grouppedObj = groupBy(obj, properties[propIndex]);
  Object.keys(grouppedObj).forEach((key) => {
    if (propIndex < properties.length - 2) {
      grouppedObj[key] = groupSubKeys(grouppedObj[key], properties, propIndex + 1);
    } else {
      grouppedObj[key] = grouppedObj[key].map(item => item[properties[propIndex + 1]])
    }
  });
  return grouppedObj;

}

const groupByProperties = (list, properties) => {

  return groupSubKeys(list, properties, 0);

}

const wait = ms => {

  let start = new Date().getTime();
  let end = start;
  while(end < start + ms) {
    end = new Date().getTime();
 }

}

module.exports = {
    getAllProducts,
    insertAllAttrs,
    prepareAllInsert,
    filterValues,
    indexByItem,
    indexBySku,
    getAllAttributes,
    groupByProperties,
    jsonAttr,
    getAllProductsPromises,
    getDataPromisesForSlice
}