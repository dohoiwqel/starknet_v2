export function encoder(message: string) {
    if ("" === message)
        return "";
    var t: any = [];
    t.push("0x");
    for (var n = 0; n < message.length; n++)
        t.push(message.charCodeAt(n).toString(16));
    return t.join("").substring(0, 65)
}