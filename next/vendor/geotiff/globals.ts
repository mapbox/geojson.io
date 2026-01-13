import type { ValueOf } from 'type-fest';

export const fieldTagNames: {
  [key: string]: string;
} = {
  // TIFF Baseline
  0x013b: 'Artist',
  0x0102: 'BitsPerSample',
  0x0109: 'CellLength',
  0x0108: 'CellWidth',
  0x0140: 'ColorMap',
  0x0103: 'Compression',
  0x8298: 'Copyright',
  0x0132: 'DateTime',
  0x0152: 'ExtraSamples',
  0x010a: 'FillOrder',
  0x0121: 'FreeByteCounts',
  0x0120: 'FreeOffsets',
  0x0123: 'GrayResponseCurve',
  0x0122: 'GrayResponseUnit',
  0x013c: 'HostComputer',
  0x010e: 'ImageDescription',
  0x0101: 'ImageLength',
  0x0100: 'ImageWidth',
  0x010f: 'Make',
  0x0119: 'MaxSampleValue',
  0x0118: 'MinSampleValue',
  0x0110: 'Model',
  0x00fe: 'NewSubfileType',
  0x0112: 'Orientation',
  0x0106: 'PhotometricInterpretation',
  0x011c: 'PlanarConfiguration',
  0x0128: 'ResolutionUnit',
  0x0116: 'RowsPerStrip',
  0x0115: 'SamplesPerPixel',
  0x0131: 'Software',
  0x0117: 'StripByteCounts',
  0x0111: 'StripOffsets',
  0x00ff: 'SubfileType',
  0x0107: 'Threshholding',
  0x011a: 'XResolution',
  0x011b: 'YResolution',

  // TIFF Extended
  0x0146: 'BadFaxLines',
  0x0147: 'CleanFaxData',
  0x0157: 'ClipPath',
  0x0148: 'ConsecutiveBadFaxLines',
  0x01b1: 'Decode',
  0x01b2: 'DefaultImageColor',
  0x010d: 'DocumentName',
  0x0150: 'DotRange',
  0x0141: 'HalftoneHints',
  0x015a: 'Indexed',
  0x015b: 'JPEGTables',
  0x011d: 'PageName',
  0x0129: 'PageNumber',
  0x013d: 'Predictor',
  0x013f: 'PrimaryChromaticities',
  0x0214: 'ReferenceBlackWhite',
  0x0153: 'SampleFormat',
  0x0154: 'SMinSampleValue',
  0x0155: 'SMaxSampleValue',
  0x022f: 'StripRowCounts',
  0x014a: 'SubIFDs',
  0x0124: 'T4Options',
  0x0125: 'T6Options',
  0x0145: 'TileByteCounts',
  0x0143: 'TileLength',
  0x0144: 'TileOffsets',
  0x0142: 'TileWidth',
  0x012d: 'TransferFunction',
  0x013e: 'WhitePoint',
  0x0158: 'XClipPathUnits',
  0x011e: 'XPosition',
  0x0211: 'YCbCrCoefficients',
  0x0213: 'YCbCrPositioning',
  0x0212: 'YCbCrSubSampling',
  0x0159: 'YClipPathUnits',
  0x011f: 'YPosition',

  // EXIF
  0x9202: 'ApertureValue',
  0xa001: 'ColorSpace',
  0x9004: 'DateTimeDigitized',
  0x9003: 'DateTimeOriginal',
  0x8769: 'Exif IFD',
  0x9000: 'ExifVersion',
  0x829a: 'ExposureTime',
  0xa300: 'FileSource',
  0x9209: 'Flash',
  0xa000: 'FlashpixVersion',
  0x829d: 'FNumber',
  0xa420: 'ImageUniqueID',
  0x9208: 'LightSource',
  0x927c: 'MakerNote',
  0x9201: 'ShutterSpeedValue',
  0x9286: 'UserComment',

  // IPTC
  0x83bb: 'IPTC',

  // ICC
  0x8773: 'ICC Profile',

  // XMP
  0x02bc: 'XMP',

  // GDAL
  0xa480: 'GDAL_METADATA',
  0xa481: 'GDAL_NODATA',

  // Photoshop
  0x8649: 'Photoshop',

  // GeoTiff
  0x830e: 'ModelPixelScale',
  0x8482: 'ModelTiepoint',
  0x85d8: 'ModelTransformation',
  0x87af: 'GeoKeyDirectory',
  0x87b0: 'GeoDoubleParams',
  0x87b1: 'GeoAsciiParams'
};

const fieldTags: Record<ValueOf<typeof fieldTagNames>, number> = {};
for (const [key, value] of Object.entries(fieldTagNames)) {
  fieldTags[value] = parseInt(key, 10);
}

const fieldTagTypes = {
  256: 'SHORT',
  257: 'SHORT',
  258: 'SHORT',
  259: 'SHORT',
  262: 'SHORT',
  273: 'LONG',
  274: 'SHORT',
  277: 'SHORT',
  278: 'LONG',
  279: 'LONG',
  282: 'RATIONAL',
  283: 'RATIONAL',
  284: 'SHORT',
  286: 'SHORT',
  287: 'RATIONAL',
  296: 'SHORT',
  305: 'ASCII',
  306: 'ASCII',
  338: 'SHORT',
  339: 'SHORT',
  513: 'LONG',
  514: 'LONG',
  1024: 'SHORT',
  1025: 'SHORT',
  2048: 'SHORT',
  2049: 'ASCII',
  33550: 'DOUBLE',
  33922: 'DOUBLE',
  34665: 'LONG',
  34735: 'SHORT',
  34737: 'ASCII',
  42113: 'ASCII'
};

export const arrayFields = [
  fieldTags.BitsPerSample,
  fieldTags.ExtraSamples,
  fieldTags.SampleFormat,
  fieldTags.StripByteCounts,
  fieldTags.StripOffsets,
  fieldTags.StripRowCounts,
  fieldTags.TileByteCounts,
  fieldTags.TileOffsets
];

const fieldTypeNames = {
  0x0001: 'BYTE',
  0x0002: 'ASCII',
  0x0003: 'SHORT',
  0x0004: 'LONG',
  0x0005: 'RATIONAL',
  0x0006: 'SBYTE',
  0x0007: 'UNDEFINED',
  0x0008: 'SSHORT',
  0x0009: 'SLONG',
  0x000a: 'SRATIONAL',
  0x000b: 'FLOAT',
  0x000c: 'DOUBLE',
  // IFD offset, suggested by https://owl.phy.queensu.ca/~phil/exiftool/standards.html
  0x000d: 'IFD',
  // introduced by BigTIFF
  0x0010: 'LONG8',
  0x0011: 'SLONG8',
  0x0012: 'IFD8'
};

export const fieldTypes: Record<ValueOf<typeof fieldTypeNames>, number> = {};
for (const [key, value] of Object.entries(fieldTypeNames)) {
  fieldTypes[value] = parseInt(key, 10);
}

const photometricInterpretations: { [key: string]: number } = {
  WhiteIsZero: 0,
  BlackIsZero: 1,
  RGB: 2,
  Palette: 3,
  TransparencyMask: 4,
  CMYK: 5,
  YCbCr: 6,

  CIELab: 8,
  ICCLab: 9
};

const ExtraSamplesValues: { [key: string]: number } = {
  Unspecified: 0,
  Assocalpha: 1,
  Unassalpha: 2
};

export const geoKeyNames: {
  [key: string]: string;
} = {
  1024: 'GTModelTypeGeoKey',
  1025: 'GTRasterTypeGeoKey',
  1026: 'GTCitationGeoKey',
  2048: 'GeographicTypeGeoKey',
  2049: 'GeogCitationGeoKey',
  2050: 'GeogGeodeticDatumGeoKey',
  2051: 'GeogPrimeMeridianGeoKey',
  2052: 'GeogLinearUnitsGeoKey',
  2053: 'GeogLinearUnitSizeGeoKey',
  2054: 'GeogAngularUnitsGeoKey',
  2055: 'GeogAngularUnitSizeGeoKey',
  2056: 'GeogEllipsoidGeoKey',
  2057: 'GeogSemiMajorAxisGeoKey',
  2058: 'GeogSemiMinorAxisGeoKey',
  2059: 'GeogInvFlatteningGeoKey',
  2060: 'GeogAzimuthUnitsGeoKey',
  2061: 'GeogPrimeMeridianLongGeoKey',
  2062: 'GeogTOWGS84GeoKey',
  3072: 'ProjectedCSTypeGeoKey',
  3073: 'PCSCitationGeoKey',
  3074: 'ProjectionGeoKey',
  3075: 'ProjCoordTransGeoKey',
  3076: 'ProjLinearUnitsGeoKey',
  3077: 'ProjLinearUnitSizeGeoKey',
  3078: 'ProjStdParallel1GeoKey',
  3079: 'ProjStdParallel2GeoKey',
  3080: 'ProjNatOriginLongGeoKey',
  3081: 'ProjNatOriginLatGeoKey',
  3082: 'ProjFalseEastingGeoKey',
  3083: 'ProjFalseNorthingGeoKey',
  3084: 'ProjFalseOriginLongGeoKey',
  3085: 'ProjFalseOriginLatGeoKey',
  3086: 'ProjFalseOriginEastingGeoKey',
  3087: 'ProjFalseOriginNorthingGeoKey',
  3088: 'ProjCenterLongGeoKey',
  3089: 'ProjCenterLatGeoKey',
  3090: 'ProjCenterEastingGeoKey',
  3091: 'ProjCenterNorthingGeoKey',
  3092: 'ProjScaleAtNatOriginGeoKey',
  3093: 'ProjScaleAtCenterGeoKey',
  3094: 'ProjAzimuthAngleGeoKey',
  3095: 'ProjStraightVertPoleLongGeoKey',
  3096: 'ProjRectifiedGridAngleGeoKey',
  4096: 'VerticalCSTypeGeoKey',
  4097: 'VerticalCitationGeoKey',
  4098: 'VerticalDatumGeoKey',
  4099: 'VerticalUnitsGeoKey'
};

const geoKeys: Record<ValueOf<typeof geoKeyNames>, number> = {};
for (const [key, value] of Object.entries(geoKeyNames)) {
  geoKeys[value] = parseInt(key, 10);
}
