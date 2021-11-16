const WooCommerce = require('../config-wc/wc');
const path = require('path');
const {
    readAllFiles,
    convertCsvToJson,
} = require('../helpers/excel-actions');
const {
    indexByItem,
    onlyUnique
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
        const dataIndex = indexByItem(data, 'name', 'id');
        const intersectionData = dataJson.filter(attr => !dataIndex[attr.atributo]);

        // const atribute = {
        //     name: "Color",
        //     slug: "pa_color",
        //     type: "select",
        //     order_by: "menu_order",
        //     has_archives: true
        // };
        // const term = {
        //     name: 'Azul'
        // }

        // const createAtribute = await WooCommerce.post("products/attributes", atribute);
        // if ( createAtribute.status === 201 ) {
        //     const { id } = createAtribute.data;
        //     const createTerm = await WooCommerce.post(`products/attributes/${id}/terms`, term);
        //     if ( createTerm.status === 201 ) {
        //         return res.status(200).json({
        //             status: createAtribute.status,
        //             atribute: createAtribute.data,
        //             terms: createTerm.data 
        //         });
        //     }
        // }

        // return res.status(404).json({
        //     msg: 'hubo un error'
        // });

        return res.json({
            intersectionData
        })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            e: 'error'
        });
    }

}