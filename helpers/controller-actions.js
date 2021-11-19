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

module.exports = {
    getAllProducts,
    filterValues,
    indexByItem,
    indexBySku,
    getAllAttributes
}