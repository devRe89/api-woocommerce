
const indexByItem = (array, key, index) => array.reduce((acc, el) =>{
    if(!acc[el[key]]){
        acc[el[key]] = [];
        acc[el[key]].push(el[index]);
    }else{
        acc[el[key]].push(el[index]);
    }
    return acc;
}, {});

const indexByItemB = (array) => array.reduce((acc, it) => (acc[it.name] = it.id, acc), {});

const onlyUnique = (value, index, self) => (
    self.indexOf(value) === index
);

module.exports = {
    indexByItem,
    onlyUnique,
    indexByItemB
}