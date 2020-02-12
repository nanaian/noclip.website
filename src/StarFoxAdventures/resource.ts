import * as pako from 'pako';
import { hexzero, nArray } from '../util';
import { GameInfo } from './scenes';
import ArrayBufferSlice from '../ArrayBufferSlice';

class ZLBHeader {
    static readonly SIZE = 16;

    magic: number;
    unk4: number;
    unk8: number;
    size: number;

    constructor(dv: DataView) {
        this.magic = dv.getUint32(0x0);
        this.unk4 = dv.getUint32(0x4);
        this.unk8 = dv.getUint32(0x8);
        this.size = dv.getUint32(0xC);
    }
}

function stringToFourCC(s: string): number {
    return (s.charCodeAt(0) << 24) | (s.charCodeAt(1) << 16) | (s.charCodeAt(2) << 8) | s.charCodeAt(3)
}

function loadZLB(compData: ArrayBufferSlice): ArrayBuffer {
    let offs = 0;
    const dv = compData.createDataView();
    const header = new ZLBHeader(dv);
    offs += ZLBHeader.SIZE;

    if (header.magic != stringToFourCC('ZLB\0')) {
        throw Error(`Invalid magic identifier 0x${hexzero(header.magic, 8)}`);
    }

    return pako.inflate(new Uint8Array(compData.copyToBuffer(ZLBHeader.SIZE, header.size))).buffer;
}

function loadDIRn(data: ArrayBufferSlice): ArrayBuffer {
    const dv = data.createDataView();
    const size = dv.getUint32(8);
    return data.copyToBuffer(0x20, size);
}

export function loadRes(data: ArrayBufferSlice): ArrayBufferSlice {
    const dv = data.createDataView();
    const magic = dv.getUint32(0);
    switch (magic) {
    case stringToFourCC('ZLB\0'):
        return new ArrayBufferSlice(loadZLB(data));
    case stringToFourCC('DIRn'): // FIXME: actually just "DIR"
        return new ArrayBufferSlice(loadDIRn(data));
        // TODO: handle LZOn format
    default:
        console.warn(`Invalid magic identifier 0x${hexzero(magic, 8)}`);
        return data;
    }
}

export function getSubdir(locationNum: number, gameInfo: GameInfo): string {
    if (gameInfo.subdirs[locationNum] === undefined) {
        throw Error(`Subdirectory for location ${locationNum} unknown`);
    }
    return gameInfo.subdirs[locationNum];
}