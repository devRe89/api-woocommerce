const WooCommerce = require('../config-wc/wc');
const path = require('path');
const {
    getJsonData
} = require('../helpers/excel-actions');
const {
    getAllProducts,
    filterValues,
    insertAllAttrs,
    indexByItem,
    prepareAllInsert,
    getAllAttributes,
    groupByProperties,
    jsonAttr,
    wait,
    getDataPromisesProductForSlice
} = require('../helpers/controller-actions');

exports.getAllAtributes = async (req, res) => {

    try {
        const response = await WooCommerce.get("products/attributes");
        res.json({
            res: response.data,
            status: response.status
        })
        
    } catch (error) {
        res.json({
            res: error
        })
    }

}

exports.getProductBySku = async (req, res) => {

    try {

        const currentDir = path.join(__dirname, '../csv-skus/');
        const dataJson = await getJsonData(currentDir);
        const skus = dataJson.map(sku => sku.sku);
        const resultData = await getDataPromisesProductForSlice(skus);
        const noSkus = []
        if ( resultData.length ) {
            const allData = resultData.map((product, pos) => {
                if ( product.status === 200 && product.data.length ) {
                    return product.data;
                } else {
                    noSkus.push(pos);
                }
            });
            return res.json({
                r: allData.length,
                totalNoSkus: noSkus.length,
                allData
            });
        }
        
        return res.json({
            r: 'no hay sku'
        });

    } catch (error) {
        console.log(error)
        res.json({
            res: 'error'
        })
    }

}

exports.createProductVariant = async (req, res) => {

    try {
        const data = {
            attributes: [
                {
                    id: 30,
                    name: "Ancho",
                    position: 0,
                    visible: true,
                    variation: false,
                    options: [
                        "30Cm",
                    ]
                }
            ],
        };
        const response = await WooCommerce.put("products/101114", data);
        res.json({
            res: response.data,
            status: response.status
        })
    } catch (error) {
        res.json({
            res: error
        });
    }
}

exports.getAllTerms = async (req, res) => {

    try {
        const response = await WooCommerce.get("products/attributes/23/terms");
        res.json({
            res: response.data,
            status: response.status
        })
        
    } catch (error) {
        res.json({
            res: error
        })
    }

}

exports.createProductAtribute = async (req, res) => {
    
    try {

        const currentDir = path.join(__dirname, '../csv-doc-attributes/');
        const dataJson = await getJsonData(currentDir);
        if ( !dataJson.length ) {
            return res.status(400).json({
                msg: 'No Hay datos disponibles en el excel'
            });
        }
        const wcAttributes = await WooCommerce.get("products/attributes");
        if ( wcAttributes.status !== 200 ) {
            return res.status(400).json({
                msg: 'Error al hacer consulta a la ApiWc'
            });
        }
        const { data } = wcAttributes;
        const dataIndex = data.reduce((acc, it) => (acc[it.name] = it.id, acc), {});
        const intersectionDataAttributes = dataJson.filter(attr => !dataIndex[attr.atributo])
              .map(item => item.atributo)
              .filter((value, index, self) => self.indexOf(value) === index);
        let attrIndex;
        if ( intersectionDataAttributes.length ) {
            // Create all Attributes.
            attrIndex = await insertAllAttrs(intersectionDataAttributes, dataIndex);
        } else {
            attrIndex = dataIndex
        }    
        const indexDataCsvTerms = indexByItem( dataJson, 'atributo', 'valores' );
        // Create Terms by Id Attribute.
        Object.keys(attrIndex).reduce(async (acc, el) => {
            if ( indexDataCsvTerms[el] ) {
                const termsCsv = indexDataCsvTerms[el];
                const responseTermsAttr = await WooCommerce.get(`products/attributes/${attrIndex[el]}/terms`);
                if ( responseTermsAttr.status === 200 ){
                    const termsNames = responseTermsAttr.data.map(wc_term => (wc_term.name));
                    const intersectionDataTerms = termsCsv.filter(csv_term => !termsNames.includes(csv_term));
                    if ( intersectionDataTerms.length ) {
                        for (let index = 0; index < intersectionDataTerms.length; index += 5) {
                            const requestLote = intersectionDataTerms.slice(index, index + 5).map( async term => {
                                const data = {
                                    name: term
                                }
                                return WooCommerce.post(`products/attributes/${attrIndex[el]}/terms`, data);
                            });
                            if ( index >= 5 ) {
                                wait(3000);
                            }
                            await Promise.all(requestLote);
                        }
                    }
                }    
                wait(4000);
                return acc;
            }
        },{});
        return res.json({
            res: 'Done!',
            attrIndex
        });
         
    } catch (error) {

        console.log(error)
        return res.status(500).json({
            e: 'error'
        });

    }

}

exports.addAttributeInProduct = async (req, res) => {

    try {

        const currentDir = path.join(__dirname, '../csv-products-attributes/');
        const dataJson = await getJsonData(currentDir);
        if ( !dataJson.length ) {
            return res.status(400).json({
                msg: 'No Hay datos disponibles en el excel'
            });
        }
        const copyDataJson = [...dataJson];
        const allSkusCsv = filterValues(dataJson, 'sku');
        const productsWc = await getDataPromisesProductForSlice(allSkusCsv);
        const indexSkuCsv = groupByProperties(copyDataJson, ['sku', 'atributo', 'valores']);
        const allAttrsWc = await getAllAttributes();
        const indexAllAttrsWc = allAttrsWc.reduce((acc, it) => (acc[it.name] = it.id, acc), {});
        if ( productsWc.length ) {
            const productsPlane = productsWc.reduce((acc, el) => acc.concat(el), []);
            for (let index = 0; index < productsPlane.length; index += 10) {
                const requestLote = productsPlane.slice(index, index + 10).map(product => {
                    if ( indexSkuCsv[product.sku] ){
                        const attrs = jsonAttr(indexSkuCsv[product.sku], product.sku, indexAllAttrsWc, indexSkuCsv);
                        const data = {
                            attributes: attrs
                        };
                        return prepareAllInsert(product.id, data);
                    }
                });
                if ( index >= 10 ) {
                    wait(4000);
                }
                await Promise.all(requestLote);
            }
        }
        return res.json({
            response: 'Done',
        });
        
    } catch (error) {

        console.log(error)
        return res.status(500).json({
            e: 'error'
        });

    }

}