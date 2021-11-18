
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
    indexByItem,
    indexBySku
}