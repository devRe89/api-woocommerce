const WooCommerce = require('../config-wc/wc');

const getOnePromiseProduct = sku => {
    const response = WooCommerce.get(`products/?sku=${sku}`);
    return response;
}

const getDataPromisesProductForSlice = async array => {

  if ( array.length ){
    const result = [];
    const arrayLength = array.length
    for (let index = 0; index <= arrayLength; index += 10) {
      const requestLote = array.slice(index, index + 10).map(item => {
        return getOnePromiseProduct(item);
      });
      if ( index >= 10 ) {
        wait(4000)
      };
      const resAllPromisesLote = await Promise.all(requestLote);
      result.push(resAllPromisesLote);
    }
    return result.reduce((acc, el) => acc.concat(el), []).map((product) => {
      if ( product.status === 200 && product.data.length ) {
          return product.data;
      }
    });
  }
  return [];

}

const getOnePromiseAttributes = attr => {
      const attribute = {
          name: attr,
          slug: `pa_${attr.toLowerCase()}`,
          type: 'select',
          order_by: 'menu_order',
          has_archives: true
      }
      return WooCommerce.post("products/attributes", attribute);
}

const insertAllAttrs = async (data, dataIndex) => {

  if ( data.length ) {
    const result = [];
    for (let index = 0; index <= data.length; index += 10) {
      const requestLote = data.slice(index, index + 10).map(item => {
          return getOnePromiseAttributes(item);
      });
      if ( index >= 10) {
        wait(4000);
      };
      const resAllPromisesLote = await Promise.all(requestLote);
      result.push(resAllPromisesLote);
    }

    if ( result.length ) {
      result.reduce((acc, el) => acc.concat(el), []).map(response => {
          if ( response.status === 201 ) {
            const { id, name } = response.data;
            dataIndex[name] = id;
          }
      });
      return dataIndex;
    } 
    return dataIndex;
  }
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

const prepareUpdateProductsPromises = (jsonCsv, id, meta) => {

  let id_meta_key = '';
  meta.some(item => {
    if ( item.key === 'nombre_tecnico' ) {
      id_meta_key = item.id
    }
  });
  const data = {
    name: jsonCsv.name,
    description: jsonCsv.description,
    meta_data: [
      {
        id: id_meta_key,
        key: 'nombre_tecnico',
        value: jsonCsv.nombre_tecnico
      }
    ]
  }
  return WooCommerce.put(`products/${id}`, data);

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
    insertAllAttrs,
    prepareAllInsert,
    filterValues,
    indexByItem,
    indexBySku,
    getAllAttributes,
    groupByProperties,
    jsonAttr,
    wait,
    getDataPromisesProductForSlice,
    prepareUpdateProductsPromises
}