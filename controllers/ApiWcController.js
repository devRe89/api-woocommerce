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
    jsonAttr
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
        const response = await WooCommerce.get("products/?sku=3010120008817");
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
        if ( intersectionDataAttributes.length > 0 ) {
            // Create all Attributes.
            attrIndex = await insertAllAttrs(intersectionDataAttributes, dataIndex);
        } else {
            attrIndex = dataIndex
        }    
        const indexDataCsvTerms = indexByItem( dataJson, 'atributo', 'valores' );
        //Create Terms by Id Attribute.
        const termsNoCreate = [];
        await Promise.all (Object.keys(attrIndex).map( async attr => {
            if ( indexDataCsvTerms[attr] ) {
                const termsCsv = indexDataCsvTerms[attr];
                const responseTermsAttr = await WooCommerce.get(`products/attributes/${attrIndex[attr]}/terms`);
                if ( responseTermsAttr.status === 200 ){
                    const termsNames = responseTermsAttr.data.map(wc_term => (wc_term.name));
                    const intersectionDataTerms = termsCsv.filter(csv_term => !termsNames.includes(csv_term));
                    if ( intersectionDataTerms ) {
                        intersectionDataTerms.map( async term => {
                            const data = {
                                name: term
                            }
                            const createTermByAttr = await WooCommerce.post(`products/attributes/${attrIndex[attr]}/terms`, data);
                            if ( createTermByAttr.status !== 201 ) {
                                termsNoCreate.push({
                                    noCreate : term
                                });
                            }
                        });
                    }
                }
                return;
            }
        }));        

        return res.json({
            res: 'Done!'
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
        const productsWc = await getAllProducts(allSkusCsv);
        const indexSkuCsv = groupByProperties(copyDataJson, ['sku', 'atributo', 'valores']);
        const allAttrsWc = await getAllAttributes();
        const indexAllAttrsWc = allAttrsWc.reduce((acc, it) => (acc[it.name] = it.id, acc), {});
        const allPromisesInsert = [];
        if ( productsWc.length ) {
            productsWc.forEach(product => {
                if ( indexSkuCsv[product.sku] ){
                    const attrs = jsonAttr(indexSkuCsv[product.sku], product.sku, indexAllAttrsWc, indexSkuCsv);
                    const data = {
                        attributes: attrs
                    };
                    allPromisesInsert.push(prepareAllInsert(product.id, data));
                }
            });
            await Promise.all(allPromisesInsert);
        }
        return res.json({
            response: 'Done'
        });
        
    } catch (error) {

        console.log(error)
        return res.status(500).json({
            e: 'error'
        });

    }

}