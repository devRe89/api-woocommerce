const WooCommerce = require('../config-wc/wc');
const path = require('path');
const {
    readAllFiles,
    convertCsvToJson,
} = require('../helpers/excel-actions');
const { indexByItem } = require('../helpers/array-actions');

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

        const currentDir = path.join(__dirname, '../csv-docs/');
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
        await Promise.all (Object.keys(dataIndex).map( async attr => {
            if ( indexDataCsvTerms[attr] ) {
                const termsCsv = indexDataCsvTerms[attr];
                const responseTermsAttr = await WooCommerce.get(`products/attributes/${dataIndex[attr]}/terms`);
                if ( responseTermsAttr.status === 200 ){
                    if ( !responseTermsAttr.data.length ) {
                        termsCsv.map( async term => {
                            const data = {
                                name: term
                            }
                            await WooCommerce.post(`products/attributes/${dataIndex[attr]}/terms`, data);
                        });
                    } else {
                        const termsNames = responseTermsAttr.data.map(wc_term => (wc_term.name));
                        const intersectionDataTerms = termsCsv.filter(csv_term => !termsNames.includes(csv_term));
                        intersectionDataTerms.map( async term => {
                            const data = {
                                name: term
                            }
                            await WooCommerce.post(`products/attributes/${dataIndex[attr]}/terms`, data);
                        });
                    }
                }
                return;
            }
        }));

        return res.json({
            dataIndex
        });
         
    } catch (error) {

        console.log(error)
        return res.status(500).json({
            e: 'error'
        });

    }

}