const WooCommerce = require('../config-wc/wc');
const path = require('path');
const {
    readAllFiles,
    convertCsvToJson,
} = require('../helpers/excel-actions');
const { 
    indexByItem,
    indexBySku
} = require('../helpers/array-actions');

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
        if ( !currentDir ) {
            return res.status(404).json({
                msg: `No se encontro la carpeta ${currentDir}`,
            });
        }
        const arrayFiles = await readAllFiles(currentDir);
        if ( !arrayFiles ) {
            return res.status(404).json({
                msg: `No se encontro algun archivo dentro del directorio marcado o el formato no es el requerido`
            });
        }
        const dataJson = await convertCsvToJson(currentDir, arrayFiles);
        if ( !dataJson ) {
            return res.status(400).json({
                msg: `No se genero ninguna informaciòn a partir del recorrido de los csv`
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

        //Create new Attributes
        if ( intersectionDataAttributes.length > 0 ){
            await Promise.all (intersectionDataAttributes.map( async attr => {
                const attribute = {
                    name: attr,
                    slug: `pa_${attr.toLowerCase()}`,
                    type: 'select',
                    order_by: 'menu_order',
                    has_archives: true
                }
                const createAttribute = await WooCommerce.post("products/attributes", attribute);
                if ( createAttribute.status === 201 ) {
                    const { id } = createAttribute.data;
                    dataIndex[attr] = id;
                }
                return;
            })); 
        }
        const indexDataCsvTerms = indexByItem( dataJson, 'atributo', 'valores' );
        
        //Create Terms by Id Attribute
        const termsNoCreate = [];
        await Promise.all (Object.keys(dataIndex).map( async attr => {
            if ( indexDataCsvTerms[attr] ) {
                const termsCsv = indexDataCsvTerms[attr];
                const responseTermsAttr = await WooCommerce.get(`products/attributes/${dataIndex[attr]}/terms`);
                if ( responseTermsAttr.status === 200 ){
                    const termsNames = responseTermsAttr.data.map(wc_term => (wc_term.name));
                    const intersectionDataTerms = termsCsv.filter(csv_term => !termsNames.includes(csv_term));
                    if ( intersectionDataTerms ) {
                        intersectionDataTerms.map( async term => {
                            const data = {
                                name: term
                            }
                            const createTermByAttr = await WooCommerce.post(`products/attributes/${dataIndex[attr]}/terms`, data);
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
            termsNoCreate
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
        if ( !currentDir ) {
            return res.status(404).json({
                msg: `No se encontro la carpeta ${currentDir}`,
            });
        }
        const arrayFiles = await readAllFiles(currentDir);
        if ( !arrayFiles ) {
            return res.status(404).json({
                msg: `No se encontro algun archivo dentro del directorio marcado o el formato no es el requerido`
            });
        }
        const dataJson = await convertCsvToJson(currentDir, arrayFiles);
        if ( !dataJson ) {
            return res.status(400).json({
                msg: `No se genero ninguna informaciòn a partir del recorrido de los csv`
            });
        }
        // All products attributes of csv
        const indexCsv = indexBySku(dataJson);
        // All Products WC
        const allProductsW = [];
        let page = 1;
        while ( page !== false ) {
            const allProductsResponse = await WooCommerce.get(`products?per_page=10&page=${page}`);
            if ( allProductsResponse.status === 200 && allProductsResponse.data.length ){
                allProductsW.push(allProductsResponse.data);
                page ++;
            } else {
                page = false;
            }
        }
        const filterProductsValues = allProductsW.reduce((acc, el) => acc.concat(el), []);

        return res.json({
            filterProductsValues
        });
        
    } catch (error) {

        console.log(error)
        return res.status(500).json({
            e: 'error'
        });
    }
}