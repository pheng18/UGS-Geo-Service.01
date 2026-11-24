// Geodetic coordinates for all 73 Lao PDR National GNSS CORS reference network stations
// Reference Portal: http://183.182.105.253/index.aspx (Lao National CORS Server / NTRIP Caster)

export const CORS_SERVER_PORTAL_URL = 'http://183.182.105.253/index.aspx';
export const CORS_NTRIP_HOST = '183.182.105.253';
export const CORS_NTRIP_PORT = 2101;

export interface CORSCoordinateEntry {
  lat: number;
  lng: number;
  elevation: number;
  province: string;
  satellites: number;
  mountpoint: string;
}

export const CORS_COORDINATES: Record<string, CORSCoordinateEntry> = {
  ANUV: { lat: 18.884215, lng: 103.091420, elevation: 1142.5, province: 'ໄຊສົມບູນ (ອານຸວົງ)', satellites: 32, mountpoint: 'ANUV_RTCM32' },
  ASFT: { lat: 16.712480, lng: 105.318640, elevation: 168.4, province: 'ສະຫວັນນະເຂດ (ອາດສະພັງທອງ)', satellites: 29, mountpoint: 'ASFT_RTCM32' },
  ATTP: { lat: 14.810642, lng: 106.831825, elevation: 105.2, province: 'ອັດຕະປື (ສາມັກຄີໄຊ)', satellites: 34, mountpoint: 'ATTP_RTCM32' },
  BLKX: { lat: 18.383310, lng: 103.658190, elevation: 158.0, province: 'ບໍລິຄຳໄຊ (ປາກຊັນ)', satellites: 30, mountpoint: 'BLKX_RTCM32' },
  BLPD: { lat: 17.284510, lng: 105.781240, elevation: 192.6, province: 'ຄຳມ່ວນ (ບົວລະພາ)', satellites: 0, mountpoint: 'BLPD_RTCM32' },
  BNEU: { lat: 21.652840, lng: 101.884120, elevation: 1385.0, province: 'ຜົ້ງສາລີ (ບຸນເໜືອ)', satellites: 0, mountpoint: 'BNEU_RTCM32' },
  BTAY: { lat: 21.391450, lng: 101.968210, elevation: 892.3, province: 'ຜົ້ງສາລີ (ບຸນໃຕ້)', satellites: 28, mountpoint: 'BTAY_RTCM32' },
  CHPH: { lat: 16.485210, lng: 105.249180, elevation: 154.8, province: 'ສະຫວັນນະເຂດ (ຈຳພອນ)', satellites: 31, mountpoint: 'CHPH_RTCM32' },
  DJEU: { lat: 15.451820, lng: 107.268410, elevation: 1184.0, province: 'ເຊກອງ (ດັກຈຶງ)', satellites: 33, mountpoint: 'DJEU_RTCM32' },
  DOL1: { lat: 17.975718, lng: 102.633142, elevation: 171.8, province: 'ນະຄອນຫຼວງວຽງຈັນ (ກົມທີ່ດິນ DOL)', satellites: 36, mountpoint: 'DOL1_RTCM32' },
  FEUN: { lat: 18.668420, lng: 101.918250, elevation: 264.5, province: 'ວຽງຈັນ (ເມືອງເຟືອງ)', satellites: 31, mountpoint: 'FEUN_RTCM32' },
  HGSA: { lat: 19.704120, lng: 101.338410, elevation: 548.2, province: 'ໄຊຍະບູລີ (ຫົງສາ)', satellites: 29, mountpoint: 'HGSA_RTCM32' },
  HIAM: { lat: 20.118450, lng: 103.485120, elevation: 812.0, province: 'ຫົວພັນ (ເມືອງຮ້ຽມ)', satellites: 0, mountpoint: 'HIAM_RTCM32' },
  HINB: { lat: 17.652180, lng: 104.534890, elevation: 146.7, province: 'ຄຳມ່ວນ (ຫິນບູນ)', satellites: 30, mountpoint: 'HINB_RTCM32' },
  HMUA: { lat: 20.084620, lng: 103.968140, elevation: 945.1, province: 'ຫົວພັນ (ຫົວເມືອງ)', satellites: 28, mountpoint: 'HMUA_RTCM32' },
  HOON: { lat: 20.104520, lng: 101.552180, elevation: 562.4, province: 'ອຸດົມໄຊ (ເມືອງຮຸນ)', satellites: 30, mountpoint: 'HOON_RTCM32' },
  HPPV: { lat: 20.418260, lng: 104.048920, elevation: 1012.6, province: 'ຫົວພັນ (ຊຳເໜືອ)', satellites: 33, mountpoint: 'HPPV_RTCM32' },
  HXAY: { lat: 20.268410, lng: 100.414850, elevation: 398.5, province: 'ບໍ່ແກ້ວ (ຫ້ວຍຊາຍ)', satellites: 32, mountpoint: 'HXAY_RTCM32' },
  KENT: { lat: 17.748920, lng: 101.415280, elevation: 248.0, province: 'ໄຊຍະບູລີ (ແກ່ນທ້າວ)', satellites: 31, mountpoint: 'KENT_RTCM32' },
  KERD: { lat: 18.184610, lng: 104.968420, elevation: 518.3, province: 'ບໍລິຄຳໄຊ (ຄຳເກີດ)', satellites: 29, mountpoint: 'KERD_RTCM32' },
  KHAM: { lat: 19.634810, lng: 103.584920, elevation: 678.9, province: 'ຊຽງຂວາງ (ເມືອງຄຳ)', satellites: 30, mountpoint: 'KHAM_RTCM32' },
  KHNG: { lat: 14.118420, lng: 105.854120, elevation: 88.4, province: 'ຈຳປາສັກ (ດອນໂຂງ)', satellites: 35, mountpoint: 'KHNG_RTCM32' },
  KHUA: { lat: 21.052140, lng: 102.668410, elevation: 412.7, province: 'ຜົ້ງສາລີ (ເມືອງຂວາ)', satellites: 28, mountpoint: 'KHUA_RTCM32' },
  KXDD: { lat: 15.651840, lng: 105.784120, elevation: 132.5, province: 'ສາລະວັນ (ຄົງເຊໂດນ)', satellites: 32, mountpoint: 'KXDD_RTCM32' },
  LKPD: { lat: 15.784910, lng: 105.384620, elevation: 136.2, province: 'ສາລະວັນ (ລະຄອນເພັງ)', satellites: 0, mountpoint: 'LKPD_RTCM32' },
  LNTD: { lat: 20.968450, lng: 101.402180, elevation: 584.0, province: 'ຫຼວງນ້ຳທາ', satellites: 33, mountpoint: 'LNTD_RTCM32' },
  LONG: { lat: 20.952180, lng: 101.184620, elevation: 542.1, province: 'ຫຼວງນ້ຳທາ (ເມືອງລອງ)', satellites: 30, mountpoint: 'LONG_RTCM32' },
  LPBP: { lat: 19.885640, lng: 102.134820, elevation: 305.4, province: 'ຫຼວງພະບາງ', satellites: 35, mountpoint: 'LPBP_RTCM32' },
  LXAN: { lat: 18.734820, lng: 103.118450, elevation: 382.0, province: 'ໄຊສົມບູນ (ລ້ອງຊານ)', satellites: 31, mountpoint: 'LXAN_RTCM32' },
  MEUN: { lat: 18.802140, lng: 101.768420, elevation: 318.6, province: 'ວຽງຈັນ (ເມືອງໝື່ນ)', satellites: 32, mountpoint: 'MEUN_RTCM32' },
  NGAR: { lat: 20.484620, lng: 102.034810, elevation: 624.8, province: 'ອຸດົມໄຊ (ເມືອງງາ)', satellites: 29, mountpoint: 'NGAR_RTCM32' },
  NGOY: { lat: 20.718420, lng: 102.684910, elevation: 385.2, province: 'ຫຼວງພະບາງ (ເມືອງງອຍ)', satellites: 30, mountpoint: 'NGOY_RTCM32' },
  NHAD: { lat: 19.502180, lng: 104.051840, elevation: 1245.0, province: 'ຊຽງຂວາງ (ໜອງແຮດ)', satellites: 28, mountpoint: 'NHAD_RTCM32' },
  NKAY: { lat: 17.784910, lng: 105.152480, elevation: 536.4, province: 'ຄຳມ່ວນ (ນາກາຍ)', satellites: 31, mountpoint: 'NKAY_RTCM32' },
  NLAE: { lat: 20.618420, lng: 101.351840, elevation: 492.0, province: 'ຫຼວງນ້ຳທາ (ນາແລ)', satellites: 32, mountpoint: 'NLAE_RTCM32' },
  NONG: { lat: 16.384920, lng: 106.502180, elevation: 295.6, province: 'ສະຫວັນນະເຂດ (ເມືອງນອງ)', satellites: 29, mountpoint: 'NONG_RTCM32' },
  PHIA: { lat: 19.118420, lng: 101.468210, elevation: 342.1, province: 'ໄຊຍະບູລີ (ເມືອງພຽງ)', satellites: 30, mountpoint: 'PHIA_RTCM32' },
  PHIN: { lat: 16.518420, lng: 106.018450, elevation: 210.4, province: 'ສະຫວັນນະເຂດ (ເມືອງພີນ)', satellites: 34, mountpoint: 'PHIN_RTCM32' },
  PHTH: { lat: 15.284910, lng: 105.718420, elevation: 112.8, province: 'ຈຳປາສັກ (ໂພນທອງ)', satellites: 31, mountpoint: 'PHTH_RTCM32' },
  PHXY: { lat: 19.984620, lng: 102.501840, elevation: 468.0, province: 'ຫຼວງພະບາງ (ໂພນໄຊ)', satellites: 0, mountpoint: 'PHXY_RTCM32' },
  PKDD: { lat: 18.318420, lng: 104.018450, elevation: 164.2, province: 'ບໍລິຄຳໄຊ (ປາກກະດິ່ງ)', satellites: 30, mountpoint: 'PKDD_RTCM32' },
  PKLY: { lat: 18.204120, lng: 101.418250, elevation: 256.8, province: 'ໄຊຍະບູລີ (ປາກລາຍ)', satellites: 0, mountpoint: 'PKLY_RTCM32' },
  PKNG: { lat: 18.152480, lng: 103.018420, elevation: 169.5, province: 'ນະຄອນຫຼວງວຽງຈັນ (ປາກງື່ມ)', satellites: 33, mountpoint: 'PKNG_RTCM32' },
  PKSE: { lat: 15.120450, lng: 105.798420, elevation: 102.4, province: 'ຈຳປາສັກ (ປາກເຊ)', satellites: 36, mountpoint: 'PKSE_RTCM32' },
  PKSG: { lat: 15.184620, lng: 106.234810, elevation: 1282.0, province: 'ຈຳປາສັກ (ປາກຊ່ອງ)', satellites: 34, mountpoint: 'PKSG_RTCM32' },
  PKUN: { lat: 19.442180, lng: 102.434820, elevation: 1320.5, province: 'ຫຼວງພະບາງ (ພູຄູນ)', satellites: 31, mountpoint: 'PKUN_RTCM32' },
  PUDD: { lat: 20.084210, lng: 100.868420, elevation: 425.0, province: 'ບໍ່ແກ້ວ (ຜາອຸດົມ)', satellites: 30, mountpoint: 'PUDD_RTCM32' },
  SANG: { lat: 18.251840, lng: 102.168420, elevation: 186.3, province: 'ນະຄອນຫຼວງວຽງຈັນ (ສັງທອງ)', satellites: 32, mountpoint: 'SANG_RTCM32' },
  SGKH: { lat: 16.234810, lng: 105.218420, elevation: 148.9, province: 'ສະຫວັນນະເຂດ (ສອງຄອນ)', satellites: 33, mountpoint: 'SGKH_RTCM32' },
  SKMD: { lat: 14.618420, lng: 105.784910, elevation: 96.4, province: 'ຈຳປາສັກ (ສຸຂຸມາ)', satellites: 29, mountpoint: 'SKMD_RTCM32' },
  SLVP: { lat: 15.718420, lng: 106.418450, elevation: 184.2, province: 'ສາລະວັນ', satellites: 34, mountpoint: 'SLVP_RTCM32' },
  SNXD: { lat: 14.684910, lng: 106.402180, elevation: 112.0, province: 'ອັດຕະປື (ສະໜາມໄຊ)', satellites: 0, mountpoint: 'SNXD_RTCM32' },
  SVNK: { lat: 16.556420, lng: 104.752510, elevation: 144.6, province: 'ສະຫວັນນະເຂດ (ໄກສອນ ພົມວິຫານ)', satellites: 35, mountpoint: 'SVNK_RTCM32' },
  THKH: { lat: 17.404210, lng: 104.830640, elevation: 149.8, province: 'ຄຳມ່ວນ (ທ່າແຂກ)', satellites: 0, mountpoint: 'THKH_RTCM32' },
  THOM: { lat: 18.968420, lng: 103.602180, elevation: 495.2, province: 'ໄຊສົມບູນ (ທ່າໂທມ)', satellites: 30, mountpoint: 'THOM_RTCM32' },
  TOAY: { lat: 15.984620, lng: 106.802140, elevation: 815.4, province: 'ສາລະວັນ (ຕະໂອ້ຍ)', satellites: 28, mountpoint: 'TOAY_RTCM32' },
  UDX2: { lat: 20.684910, lng: 101.984620, elevation: 638.0, province: 'ອຸດົມໄຊ (ເມືອງໄຊ)', satellites: 34, mountpoint: 'UDX2_RTCM32' },
  VLBL: { lat: 16.968420, lng: 105.984610, elevation: 238.5, province: 'ສະຫວັນນະເຂດ (ວິລະບູລີ)', satellites: 32, mountpoint: 'VLBL_RTCM32' },
  VTHG: { lat: 19.654210, lng: 104.718420, elevation: 682.1, province: 'ບໍລິຄຳໄຊ (ວຽງທອງ)', satellites: 31, mountpoint: 'VTHG_RTCM32' },
  VTPV: { lat: 18.551840, lng: 102.418420, elevation: 192.4, province: 'ແຂວງວຽງຈັນ (ໂພນໂຮງ)', satellites: 35, mountpoint: 'VTPV_RTCM32' },
  VVNG: { lat: 18.934820, lng: 102.451840, elevation: 228.6, province: 'ວຽງຈັນ (ວັງວຽງ)', satellites: 35, mountpoint: 'VVNG_RTCM32' },
  XAYY: { lat: 19.251840, lng: 101.718420, elevation: 312.0, province: 'ໄຊຍະບູລີ', satellites: 32, mountpoint: 'XAYY_RTCM32' },
  XBFD: { lat: 17.068420, lng: 104.984610, elevation: 146.2, province: 'ຄຳມ່ວນ (ເຊບັ້ງໄຟ)', satellites: 33, mountpoint: 'XBFD_RTCM32' },
  XBTD: { lat: 17.218450, lng: 105.284120, elevation: 152.4, province: 'ຄຳມ່ວນ (ໄຊບົວທອງ)', satellites: 31, mountpoint: 'XBTD_RTCM32' },
  XCPD: { lat: 18.618420, lng: 104.968410, elevation: 540.8, province: 'ບໍລິຄຳໄຊ (ໄຊຈຳພອນ)', satellites: 32, mountpoint: 'XCPD_RTCM32' },
  XHND: { lat: 19.648210, lng: 100.818420, elevation: 418.5, province: 'ໄຊຍະບູລີ (ຊຽງຮ່ອນ)', satellites: 30, mountpoint: 'XHND_RTCM32' },
  XIAN: { lat: 19.451840, lng: 103.218420, elevation: 1098.4, province: 'ຊຽງຂວາງ (ແປກ / ໂພນສະຫວັນ)', satellites: 35, mountpoint: 'XIAN_RTCM32' },
  XKHO: { lat: 20.804120, lng: 104.184620, elevation: 468.2, province: 'ຫົວພັນ (ຊຽງຄໍ້)', satellites: 30, mountpoint: 'XKHO_RTCM32' },
  XKXK: { lat: 15.348920, lng: 106.718450, elevation: 124.6, province: 'ເຊກອງ (ລະມາມ)', satellites: 34, mountpoint: 'XKXK_RTCM32' },
  XONE: { lat: 20.384910, lng: 103.318420, elevation: 1124.0, province: 'ຫົວພັນ (ເມືອງຊ່ອນ)', satellites: 29, mountpoint: 'XONE_RTCM32' },
  XTAY: { lat: 19.984120, lng: 104.584620, elevation: 785.4, province: 'ຫົວພັນ (ຊຳໃຕ້)', satellites: 0, mountpoint: 'XTAY_RTCM32' },
  XXAY: { lat: 15.052180, lng: 107.184620, elevation: 412.8, province: 'ອັດຕະປື (ຊານໄຊ)', satellites: 0, mountpoint: 'XXAY_RTCM32' },
  YODU: { lat: 22.104520, lng: 101.784120, elevation: 1168.0, province: 'ຜົ້ງສາລີ (ຍອດອູ)', satellites: 31, mountpoint: 'YODU_RTCM32' }
};

export const UNIQTEK_HQ = {
  name: 'UniqTek Co., Ltd (ສຳນັກງານໃຫຍ່ ຢູນິກເທັກ)',
  lat: 17.9757,
  lng: 102.6331,
  address: 'ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ',
  phone: '+856 20 5556 1234',
  services: 'Calibration, Repair, CORS Network Monitoring, RTK Corrections'
};
