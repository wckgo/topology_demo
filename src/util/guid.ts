let idStart:number = 0x0907;
function guid():number {
    return idStart++;
}
export default guid;