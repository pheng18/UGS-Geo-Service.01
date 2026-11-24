import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Radio,
  Satellite,
  CheckCircle2,
  BookOpen,
  Play,
  Award,
  Sliders,
  Check,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Wifi,
  Printer,
  Calendar,
  Users,
  Plus,
  MapPin,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Wrench,
  Camera,
  Smartphone,
  Cpu,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CORS_COORDINATES,
  CORS_NTRIP_HOST,
  CORS_NTRIP_PORT,
  CORS_SERVER_PORTAL_URL
} from '../data/corsLocations';

interface ChcnavProductSpec {
  id: string;
  model: string;
  tagline: string;
  badge: string;
  channels: string;
  imuSpec: string;
  visualSpec: string;
  batteryAndIp: string;
  bestFor: string;
  highlights: string[];
}

const CHCNAV_PRODUCTS: ChcnavProductSpec[] = [
  {
    id: 'i93',
    model: 'CHCNAV i93 Visual IMU-RTK',
    tagline: 'ເຄື່ອງຮັບສັນຍານດາວທຽມສຳຫຼວດ GNSS RTK ລະດັບສູງສຸດ ພ້ອມກ້ອງຄູ່ AR ນຳທາງວາງໝຸດພິກັດ 3 ມິຕິ',
    badge: 'Flagship Visual RTK',
    channels: '1408 ຊ່ອງສັນຍານ (ເຕັກໂນໂລຊີ iStar • ຮອງຮັບ GPS, GLONASS, BeiDou, Galileo, QZSS)',
    imuSpec: 'ລະບົບຊົດເຊີຍມຸມອຽງອັດຕະໂນມັດ Auto-IMU 200Hz (ບໍ່ຕ້ອງປັບຕັ້ງຄ່າເລີ່ມຕົ້ນ • ອຽງໄມ້ໂພລສຳຫຼວດໄດ້ເຖິງ 60° ຄ່າຄວາມຊັດເຈນ ±2 cm)',
    visualSpec: 'ລະບົບກ້ອງຄູ່ Dual-Camera ສະແດງຕຳແໜ່ງວາງໝຸດພິກັດ (AR Stakeout) ເທິງພາບຈິງໃນໂປຣແກຣມ LandStar 8',
    batteryAndIp: 'ແບັດເຕີຣີໃຊ້ງານຕໍ່ເນື່ອງສູງສຸດ 34 ຊົ່ວໂມງ • ມາດຕະຖານປ້ອງກັນນ້ຳ ແລະ ຝຸ່ນລະອອງ IP68',
    bestFor: 'ວຽກວາງໝຸດຜັງກໍ່ສ້າງຄວາມຊັດເຈນສູງ (AR Stakeout), ການຮັງວັດຈຸດທີ່ເຂົ້າເຖິງຍາກ ແລະ ໂຄງການສຳຫຼວດພູມສັນຖານຂະໜາດໃຫຍ່',
    highlights: [
      'ລະບົບປະມວນຜົນ Hybrid GNSS + Auto-IMU 200Hz ພ້ອມວັດແທກພາຍໃນ 3 ວິນາທີ',
      'ຟັງຊັນ AR Visual Stakeout ນຳທາງຊອກຫາຈຸດພິກັດໝຸດດ້ວຍພາບກ້ອງສົດໃນ LandStar 8',
      'ຮອງຮັບການສື່ສານຄົບວົງຈອນ: NTRIP 4G, Wi-Fi, Bluetooth, NFC ແລະ ວິທະຍຸຮັບ-ສົ່ງພາຍໃນ UHF 2W'
    ]
  },
  {
    id: 'i89',
    model: 'CHCNAV i89 Visual Pocket IMU-RTK',
    tagline: 'ເຄື່ອງຮັບສັນຍານ GNSS RTK ຂະໜາດກະທັດຮັດ ນ້ຳໜັກເບົາ 750g ພ້ອມກ້ອງຄູ່ສຳຫຼວດ ແລະ ວາງໝຸດພິກັດ',
    badge: 'Compact Visual RTK',
    channels: '1408 ຊ່ອງສັນຍານ ຮອງຮັບທຸກລະບົບດາວທຽມ (Full-Constellation iStar Engine)',
    imuSpec: 'ເຊັນເຊີ Auto-IMU 200Hz ປ້ອງກັນຄື້ນແມ່ເຫຼັກລົບກວນ ຊົດເຊີຍມຸມອຽງໄມ້ໂພລອັດຕະໂນມັດ',
    visualSpec: 'ກ້ອງຄູ່ Dual-Camera ຮອງຮັບການວາງໝຸດ AR Stakeout ແລະ ການວັດແທກຄ່າພິກັດຈາກພາບຖ່າຍ (Visual Survey) ໃນ LandStar 8',
    batteryAndIp: 'ແບັດເຕີຣີໃຊ້ງານ 16.5 ຊົ່ວໂມງ • ນ້ຳໜັກພຽງ 750 ກຣາມ • ມາດຕະຖານ IP68 ທົນຕໍ່ການຕົກກະແທກ 2 ແມັດ',
    bestFor: 'ທີມວິສະວະກອນສຳຫຼວດພາກສະໜາມທີ່ຕ້ອງການຄວາມຄ່ອງຕົວສູງ ປະຕິບັດງານຮັງວັດຕໍ່ເນື່ອງໝົດມື້',
    highlights: [
      'ນ້ຳໜັກເບົາພຽງ 750g ພ້ອມລະບົບກ້ອງຄູ່ AR Visual Stakeout ຄົບຊຸດ',
      'ຕິດຕັ້ງໂມເດັມວິທະຍຸ UHF ພາຍໃນ ໃຊ້ງານໄດ້ທັງສະຖານີອ້າງອີງ (Base) ແລະ ເຄື່ອງວັດແທກເຄື່ອນທີ່ (Rover)',
      'ເຊື່ອມຕໍ່ເຄື່ອງຄວບຄຸມ HCE600 ກັບໂປຣແກຣມ LandStar 8 ດ້ວຍລະບົບສຳຜັດ NFC (One-Touch NFC Pairing)'
    ]
  },
  {
    id: 'i73plus',
    model: 'CHCNAV i73+ & iBase UHF Kit',
    tagline: 'ຊຸດເຄື່ອງຮັບສັນຍານ Pocket IMU-RTK Rover ຄູ່ກັບສະຖານີສົ່ງສັນຍານວິທະຍຸອ້າງອີງ iBase 5W',
    badge: 'Best Value Base+Rover',
    channels: '1408 ຊ່ອງສັນຍານ ພ້ອມພາກຮັບ-ສົ່ງວິທະຍຸ UHF ໃນຕົວ (Integrated UHF Transceiver)',
    imuSpec: 'ລະບົບຊົດເຊີຍມຸມອຽງ Auto-IMU 200Hz ເພີ່ມປະສິດທິພາບການສຳຫຼວດເກັບລາຍລະອຽດພູມສັນຖານ (Topo Survey) ໄວຂຶ້ນ 30%',
    visualSpec: 'ສະແດງຜົນຮ່ວມກັບແຜນຜັງພື້ນຖານ CAD Base Map ໃນໂປຣແກຣມ LandStar 8 ຢ່າງລ່ຽນໄຫຼ',
    batteryAndIp: 'i73+ ໃຊ້ງານໄດ້ 15+ ຊົ່ວໂມງ • iBase ກຳລັງສົ່ງ 5W ພ້ອມລະບົບກວດສອບຄື້ນຄວາມຖີ່ລົບກວນ UHF ອັດຕະໂນມັດ',
    bestFor: 'ວຽກສຳຫຼວດອອກໃບຕາດິນ, ວຽກສຳຫຼວດຊົນລະປະທານ-ເສັ້ນທາງ ແລະ ພື້ນທີ່ຫ່າງໄກທີ່ບໍ່ມີສັນຍານໂທລະສັບ 4G',
    highlights: [
      'ສະຖານີ iBase ມີຟັງຊັນກວດວິເຄາະຄື້ນຄວາມຖີ່ UHF ອັດຕະໂນມັດ ເພື່ອເລືອກຊ່ອງສັນຍານທີ່ບໍ່ມີຄື້ນລົບກວນ',
      'ຮອງຮັບມາດຕະຖານໂປຣໂຕຄໍວິທະຍຸ CHC, Transparent EOT ແລະ TrimTalk 450S',
      'ໄລຍະສົ່ງສັນຍານຄ່າປັບແກ້ວິທະຍຸ UHF ໄກ 5–8 ກິໂລແມັດ ໃນສະພາບພື້ນທີ່ໂລ່ງແຈ້ງ'
    ]
  },
  {
    id: 'hce600',
    model: 'CHCNAV HCE600 & LandStar 8',
    tagline: 'ເຄື່ອງຄວບຄຸມພາກສະໜາມ (Field Controller) ພ້ອມໂປຣແກຣມສຳຫຼວດວິສະວະກຳ LandStar 8 ລຸ້ນຫຼ້າສຸດ',
    badge: 'Controller & Software',
    channels: 'ລະບົບປະຕິບັດການ Android 10 • ຮອງຮັບ 4G LTE Dual-SIM • Wi-Fi • Bluetooth 5.0 • NFC',
    imuSpec: 'ປະມວນຜົນແຜນຜັງ 3D CAD, ພາບນຳທາງວາງໝຸດ AR Stakeout ແລະ ຄຳນວນບໍລິມາດດິນ (Surface Volume) ໃນພາກສະໜາມ',
    visualSpec: 'ໜ້າຈໍສຳຜັດ 5.5" DragonTrail HD ຄວາມແຈ້ງສູງສູ້ແສງແດດ ພ້ອມແປ້ນພິມປຸ່ມກົດຕົວເລກ (Physical Keypad)',
    batteryAndIp: 'ແບັດເຕີຣີໃຊ້ງານຕໍ່ເນື່ອງ 14 ຊົ່ວໂມງ • ມາດຕະຖານ IP68 • ຮອງຮັບໄຟລ໌ມາດຕະຖານ DXF, DWG, SHP, KML, CSV, LandXML',
    bestFor: 'ຄວບຄຸມເຄື່ອງຮັບສັນຍານ GNSS CHCNAV ທຸກຮຸ່ນ ແລະ ເປີດໄຟລ໌ແຜນຜັງກໍ່ສ້າງ AutoCAD ເພື່ອວາງໝຸດພິກັດໂດຍກົງໃນພາກສະໜາມ',
    highlights: [
      'ໂຄງສ້າງເມນູມາດຕະຖານວິສະວະກຳສຳຫຼວດໃນ LandStar 8: Project, Connect, Survey, Cogo, Tools',
      'ຮອງຮັບລະບົບສຳຮອງຂໍ້ມູນ CHCNAV Cloud ແລະ ສົ່ງອອກໄຟລ໌ຄ່າພິກັດຜ່ານ WhatsApp / Telegram ທັນທີ',
      'ລະບົບແຈ້ງເຕືອນດ້ວຍສຽງເມື່ອສະຖານະການຄຳນວນພິກັດປ່ຽນເປັນ RTK Fixed'
    ]
  }
];

interface TrainingModule {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  level: 'ພື້ນຖານ (Basic)' | 'ກາງ (Intermediate)' | 'ສູງ (Advanced)';
  landStarMenuPath: string;
  summary: string;
  steps: Array<{
    title: string;
    detail: string;
    parameterHint?: string;
  }>;
  proTip: string;
}

const CHCNAV_TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'chc-mod-1',
    number: '01',
    title: 'ການສ້າງໂຄງການສຳຫຼວດໃໝ່ ແລະ ການກຳນົດລະບົບພິກັດອ້າງອີງ ສປປ ລາວ ໃນ LandStar 8',
    subtitle: 'ການຕັ້ງຄ່າພິກັດ WGS84 UTM Zone 48N / 47N ແລະ ແບບຈຳລອງລະດັບນ້ຳທະເລ Geoid EGM2008',
    duration: '25 ນາທີ',
    level: 'ພື້ນຖານ (Basic)',
    landStarMenuPath: 'LandStar 8 ➔ Project ➔ New Project ➔ Coordinate System',
    summary:
      'ຂັ້ນຕອນມາດຕະຖານໃນການສ້າງໄຟລ໌ໂຄງການສຳຫຼວດໃໝ່ (Project/Job) ໃນໂປຣແກຣມ CHCNAV LandStar 8 ເທິງເຄື່ອງຄວບຄຸມ HCE600 ພ້ອມທັງການກຳນົດເຂດພິກັດແຜນທີ່ UTM ແລະ ລະບົບຄວາມສູງອ້າງອີງໃຫ້ຖືກຕ້ອງຕາມມາດຕະຖານວຽກສຳຫຼວດໃນ ສປປ ລາວ.',
    steps: [
      {
        title: '1. ສ້າງໂຄງການສຳຫຼວດໃໝ່ (Project ➔ New Project)',
        detail:
          'ເປີດໂປຣແກຣມ LandStar 8 ເທິງເຄື່ອງຄວບຄຸມ HCE600, ກົດເມນູ "Project" ແລ້ວເລືອກ "New". ກຳນົດຊື່ໂຄງການສຳຫຼວດ (ເຊັ່ນ VTE_ROAD_2025), ລະບຸຊື່ຜູ້ປະຕິບັດງານສຳຫຼວດ (Operator) ແລ້ວກົດ Next ເພື່ອຕັ້ງຄ່າລະບົບພິກັດ.',
        parameterHint: 'Menu: Project > New > Project Name & Operator'
      },
      {
        title: '2. ກຳນົດລະບົບພິກັດອ້າງອີງ WGS84 UTM Zone 48N ຫຼື 47N',
        detail:
          'ໃນໜ້າ Coordinate System ກົດ "Select from Predefined" ແລ້ວເລືອກພື້ນຫຼັກອ້າງອີງ (Datum) ເປັນ "WGS84". ສຳລັບພື້ນທີ່ສ່ວນໃຫຍ່ຂອງ ສປປ ລາວ (ເສັ້ນແວງ Longitude > 102°E ເຊັ່ນ ນະຄອນຫຼວງວຽງຈັນ, ຫຼວງພະບາງ, ສະຫວັນນະເຂດ, ປາກເຊ) ໃຫ້ເລືອກ "UTM Zone 48N (ເສັ້ນແວງກາງ CM 105°E)". ສ່ວນພື້ນທີ່ແຂວງບໍ່ແກ້ວ ແລະ ໄຊຍະບູລີຕອນຕາເວັນຕົກ (< 102°E) ໃຫ້ເລືອກ "UTM Zone 47N (CM 99°E)".',
        parameterHint: 'Ellipsoid: WGS84 | Projection: Transverse Mercator (Scale Factor 0.9996)'
      },
      {
        title: '3. ການຕັ້ງຄ່າແບບຈຳລອງລະດັບຄວາມສູງ Geoid Model (EGM2008)',
        detail:
          'ກໍລະນີໂຄງການຕ້ອງການຄ່າລະດັບຄວາມສູງທຽບໃສ່ລະດັບນ້ຳທະເລປານກາງ (Orthometric Height / MSL) ແທນຄ່າຄວາມສູງວົງຮີໂລກ (Ellipsoidal Height), ໃຫ້ເຂົ້າແທັບ "Vertical System" ແລ້ວເປີດໃຊ້ "Geoid File" ແລະ ເລືອກໄຟລ໌ແບບຈຳລອງລະດັບ Geoid EGM2008_Laos.ggf.',
        parameterHint: 'Vertical Adjustment: Geoid Model -> EGM2008_Laos.ggf'
      },
      {
        title: '4. ການນຳເຂົ້າຄ່າພິກັດໝຸດຄວບຄຸມ ແລະ ແຜນຜັງກໍ່ສ້າງ (Import Control Points / DXF)',
        detail:
          'ເຂົ້າເມນູ Project -> Import ເພື່ອນຳເຂົ້າໄຟລ໌ຄ່າພິກັດໝຸດຄວບຄຸມ (.csv / .txt ຮູບແບບ P, N, E, Z, Code) ຫຼື ເຂົ້າ Survey -> Base Map ເພື່ອນຳເຂົ້າໄຟລ໌ແຜນຜັງ AutoCAD (.dxf / .dwg) ມາສະແດງເປັນແຜນທີ່ພື້ນຫຼັງ.',
        parameterHint: 'Format: Point, Northing, Easting, Elevation, Code (.csv) | CAD: .dxf / .dwg'
      }
    ],
    proTip:
      'ໃນໂປຣແກຣມ LandStar 8 ທ່ານສາມາດເປີດໃຊ້ຄຳສັ່ງ "Use Last Project Settings" ຂະນະສ້າງໂຄງການໃໝ່ ເພື່ອດຶງຄ່າພາຣາມິເຕີລະບົບພິກັດ UTM Zone 48N ແລະ ໄຟລ໌ Geoid ຈາກໂຄງການກ່ອນໜ້າມາໃຊ້ງານທັນທີ ໂດຍບໍ່ຕ້ອງຕັ້ງຄ່າຊ້ຳຄືນໃໝ່.'
  },
  {
    id: 'chc-mod-2',
    number: '02',
    title: 'ການເຊື່ອມຕໍ່ເຄື່ອງຮັບສັນຍານ CHCNAV (i93 / i89 / i73+) ເຂົ້າກັບໂປຣແກຣມ LandStar 8',
    subtitle: 'ການຈັບຄູ່ສັນຍານ Bluetooth / Wi-Fi / NFC, ການກວດສອບສະຖານະ RTK ແລະ ການຕັ້ງຄ່າຄວາມສູງເສົາອາກາດ',
    duration: '20 ນາທີ',
    level: 'ພື້ນຖານ (Basic)',
    landStarMenuPath: 'LandStar 8 ➔ Connect ➔ Connect to GNSS',
    summary:
      'ຂັ້ນຕອນການເຊື່ອມຕໍ່ເຄື່ອງຄວບຄຸມພາກສະໜາມ HCE600 ເຂົ້າກັບຫົວເຄື່ອງຮັບສັນຍານດາວທຽມ CHCNAV GNSS ພ້ອມທັງການອ່ານຄ່າຄວາມຊັດເຈນທາງຮາບ-ທາງດິ່ງ (HRMS/VRMS) ແລະ ການກຳນົດຄວາມສູງໄມ້ໂພລກ່ອນເລີ່ມຮັງວັດ.',
    steps: [
      {
        title: '1. ການຈັບຄູ່ອຸປະກອນຜ່ານ NFC ຫຼື Bluetooth (Connect ➔ Connect)',
        detail:
          'ເປີດຫົວເຄື່ອງຮັບສັນຍານ CHCNAV i93/i89/i73+. ນຳເອົາດ້ານຫຼັງຂອງເຄື່ອງຄວບຄຸມ HCE600 ແຕະໃສ່ສັນຍາລັກ NFC ເທິງຕົວເຄື່ອງ ເພື່ອຈັບຄູ່ອັດຕະໂນມັດ ຫຼື ເຂົ້າ LandStar 8 -> Connect -> Connect -> ເລືອກ Brand: CHCNAV, Model: i93/i89, Connection Type: Bluetooth ແລ້ວເລືອກໝາຍເລກເຄື່ອງ (Serial Number).',
        parameterHint: 'Brand: CHCNAV | Device: i93 / i89 / i73+ | Link: Bluetooth / NFC'
      },
      {
        title: '2. ການກວດສອບສະຖານະການຄຳນວນພິກັດ RTK ແລະ ຄ່າຄວາມຄາດເຄື່ອນ (HRMS / VRMS)',
        detail:
          'ສັງເກດແຖບສະຖານະດ້ານເທິງຂອງ LandStar 8: "Single" (ພິກັດດ່ຽວຍັງບໍ່ມີຄ່າປັບແກ້ ±1.5m), "Float" (ກຳລັງປະມວນຜົນຄ່າປັບແກ້ ±20cm) ແລະ "Fixed" (ລ໊ອກຄ່າພິກັດ RTK ສຳເລັດ ໂດຍຄ່າຄວາມຄາດເຄື່ອນທາງຮາບ HRMS ≤ 0.015m ແລະ ທາງດິ່ງ VRMS ≤ 0.025m).',
        parameterHint: 'RTK Fixed Standard: HRMS ≤ 0.015m | VRMS ≤ 0.025m | PDOP < 2.0'
      },
      {
        title: '3. ການກຳນົດຮູບແບບການວັດແທກຄວາມສູງຫົວເຄື່ອງ (Antenna Parameter)',
        detail:
          'ເຂົ້າເມນູ Connect -> Antenna ເພື່ອກວດສອບຄ່າພາຣາມິເຕີຈຸດສູນກາງເຟສເສົາອາກາດ (Phase Center Offset). ສຳລັບການສຳຫຼວດດ້ວຍເຄື່ອງ Rover ເທິງໄມ້ໂພລ ໃຫ້ເລືອກຮູບແບບ "Pole Bottom (ວັດແທກຈາກປາຍໄມ້ໂພລຕາມລວງຕັ້ງ)" ແລະ ປ້ອນຄ່າຄວາມສູງຕົວຈິງ ເຊັ່ນ 2.000m ຫຼື 1.800m.',
        parameterHint: 'Antenna Measure Type: Pole Bottom (Vertical Height) = 2.000 m'
      }
    ],
    proTip:
      'ເມື່ອໃຊ້ງານເຄື່ອງຮຸ່ນ CHCNAV i93 ຫຼື i89 ໃນໂໝດວາງໝຸດດ້ວຍກ້ອງຄູ່ AR Visual Stakeout, ໂປຣແກຣມ LandStar 8 ຈະສະຫຼັບການເຊື່ອມຕໍ່ຂໍ້ມູນພາບຜ່ານ Wi-Fi ອັດຕະໂນມັດ ເພື່ອສົ່ງສັນຍານພາບວິດີໂອຄວາມລະອຽດສູງໂດຍບໍ່ຊັກຊ້າ.'
  },
  {
    id: 'chc-mod-3',
    number: '03',
    title: `ການຕັ້ງຄ່າ Rover NTRIP ເຊື່ອມຕໍ່ໂຄງຂ່າຍສະຖານີອ້າງອີງແຫ່ງຊາດລາວ (${CORS_NTRIP_HOST})`,
    subtitle: 'ຂັ້ນຕອນການສ້າງໂປຣໄຟລ໌ການເຮັດວຽກ (Work Mode) ໃນ LandStar 8 ເພື່ອຮັບຂໍ້ມູນປັບແກ້ RTCM 3.2',
    duration: '35 ນາທີ',
    level: 'ກາງ (Intermediate)',
    landStarMenuPath: 'LandStar 8 ➔ Connect ➔ Rover ➔ Work Mode (NTRIP)',
    summary:
      'ຄູ່ມືເຕັກນິກການຕັ້ງຄ່າເຄື່ອງຮັບສັນຍານ CHCNAV Rover ເພື່ອຮັບຂໍ້ມູນຄ່າປັບແກ້ສັນຍານດາວທຽມ (Differential Correction - RTCM 3.2) ຈາກເຊີບເວີສະຖານີອ້າງອີງພິກັດຢ່າງຕໍ່ເນື່ອງແຫ່ງຊາດລາວ (Lao National CORS Network 73 ສະຖານີ) ຜ່ານລະບົບເຄືອຂ່າຍ 4G NTRIP.',
    steps: [
      {
        title: '1. ສ້າງໂປຣໄຟລ໌ໂໝດ Rover ໃໝ່ (Connect ➔ Rover ➔ Work Mode)',
        detail:
          'ເຂົ້າແທັບ Connect -> ກົດເມນູ "Rover" -> ກົດ "New" ເພື່ອສ້າງໂປຣໄຟລ໌ການຮັບສັນຍານໃໝ່ ແລະ ຕັ້ງຊື່ໂປຣໄຟລ໌ວ່າ "LAO_CORS_NTRIP".',
        parameterHint: 'Work Mode Profile: LAO_CORS_NTRIP (Network RTK Mode)'
      },
      {
        title: '2. ກຳນົດຊ່ອງທາງຮັບຂໍ້ມູນ (Data Link) ແລະ ຄ່າ IP 183.182.105.253:2101',
        detail: `ເລືອກ Data Link ເປັນ "PDA Network" (ໃຊ້ອິນເຕີເນັດຈາກຊິມກາດໃນເຄື່ອງຄວບຄຸມ HCE600) ຫຼື "Receiver Network" (ໃຊ້ຊິມກາດໃນຫົວເຄື່ອງ GNSS). ກຳນົດ Protocol = "NTRIP", IP Address = "${CORS_NTRIP_HOST}", Port = "${CORS_NTRIP_PORT}".`,
        parameterHint: `Protocol: NTRIP | Server IP: ${CORS_NTRIP_HOST} | Port: ${CORS_NTRIP_PORT}`
      },
      {
        title: '3. ດຶງຕາຕະລາງສະຖານີອ້າງອີງ (Download Source Table / Mountpoint)',
        detail:
          'ກົດປຸ່ມດາວໂຫຼດຂ້າງຊ່ອງ "Mountpoint" ເພື່ອດຶງລາຍຊື່ສະຖານີອ້າງອີງທັງ 73 ແຫ່ງ. ເລືອກລະຫັດສະຖານີ (Mountpoint) ທີ່ມີໄລຍະເສັ້ນຖານ (Baseline Distance) ໃກ້ພື້ນທີ່ສຳຫຼວດທີ່ສຸດ ເຊັ່ນ DOL1_RTCM32 (ແນະນຳໄລຍະຫ່າງບໍ່ເກີນ 35 km).',
        parameterHint: 'Mountpoint: DOL1_RTCM32 / LPB1_RTCM32 / PKS1_RTCM32 (Baseline < 35 km)'
      },
      {
        title: '4. ປ້ອນບັນຊີຜູ້ໃຊ້ NTRIP ແລະ ເປີດສົ່ງຄ່າພິກັດ NMEA GGA',
        detail:
          'ປ້ອນຊື່ຜູ້ໃຊ້ (Username) ແລະ ລະຫັດຜ່ານ (Password) ຂອງບັນຊີ Lao CORS, ໝາຍເລືອກ "Send NMEA GGA (1s)" ເພື່ອສົ່ງຕຳແໜ່ງເບື້ອງຕົ້ນໄປຫາເຊີບເວີ ແລ້ວກົດ Save & Accept. ສັງເກດແຖບຮັບຂໍ້ມູນຂຶ້ນ 100% ແລະ ສະຖານະປ່ຽນເປັນ "Fixed".',
        parameterHint: 'Diff Age: 1s | RTCM Stream: 100% | RTK Status: Fixed'
      }
    ],
    proTip:
      'ໃນໂປຣແກຣມ LandStar 8 ມີຟັງຊັນຈັດລຽງສະຖານີຕາມໄລຍະຫ່າງ (Sort Mountpoints by Distance) ເຊິ່ງຈະຄຳນວນໄລຍະເສັ້ນຖານ (Baseline) ຈາກຕຳແໜ່ງເຄື່ອງ Rover ໄປຫາສະຖານີ CORS ແຕ່ລະແຫ່ງ ແລະ ນຳເອົາສະຖານີທີ່ໃກ້ທີ່ສຸດຂຶ້ນມາສະແດງຢູ່ແຖວທຳອິດໂດຍອັດຕະໂນມັດ.'
  },
  {
    id: 'chc-mod-4',
    number: '04',
    title: 'ການຕັ້ງສະຖານີອ້າງອີງພາກສະໜາມ Base & Rover ດ້ວຍວິທະຍຸ UHF (CHCNAV iBase)',
    subtitle: 'ການກຳນົດໂປຣໂຕຄໍຄື້ນວິທະຍຸ CHC / Transparent / TT450S ສຳລັບພື້ນທີ່ອັບສັນຍານອິນເຕີເນັດ',
    duration: '35 ນາທີ',
    level: 'ກາງ (Intermediate)',
    landStarMenuPath: 'LandStar 8 ➔ Connect ➔ Base & Rover (Internal Radio)',
    summary:
      'ຂັ້ນຕອນການຕັ້ງຄ່າເຄື່ອງ CHCNAV iBase, i93 ຫຼື i89 ເປັນສະຖານີອ້າງອີງພາກສະໜາມ (Local Base Station) ເພື່ອສົ່ງຂໍ້ມູນປັບແກ້ RTCM ຜ່ານຄື້ນວິທະຍຸຄວາມຖີ່ UHF ໄປຫາເຄື່ອງ Rover ໃນເຂດພູດອຍ, ປ່າໄມ້ ຫຼື ໂຄງການກໍ່ສ້າງທີ່ບໍ່ມີສັນຍານ 4G.',
    steps: [
      {
        title: '1. ການຕັ້ງຂາຕັ້ງກ້ອງເໜືອໝຸດຄວບຄຸມ ແລະ ການວັດແທກຄວາມສູງຕາມລວງຄ້ອຍ (Slant Height)',
        detail:
          'ຕັ້ງຂາຕັ້ງກ້ອງ (Tripod) ແລະ ປັບລະດັບນ້ຳພ້ອມສ່ອງກ້ອງດິ່ງ (Optical Plummet) ໃຫ້ກົງຈຸດໝຸດຄວບຄຸມ (Benchmark). ຕິດຕັ້ງເສົາອາກາດວິທະຍຸ UHF ໃສ່ຫົວເຄື່ອງ Base ແລະ ວັດແທກຄວາມສູງຈາກຫົວໝຸດຄວບຄຸມຫາແຜ່ນວັດແທກຂອບເຄື່ອງ (Slant Height).',
        parameterHint: 'Antenna Measure Method: Slant Height to Measuring Plate'
      },
      {
        title: '2. ການກວດວິເຄາະຄື້ນຄວາມຖີ່ລົບກວນ UHF (Channel Interference Check)',
        detail:
          'ເຊື່ອມຕໍ່ LandStar 8 ເຂົ້າກັບຫົວເຄື່ອງ Base -> ເຂົ້າ Connect -> Base -> Data Link: Internal Radio. ໃຊ້ຟັງຊັນກວດສອບຄວາມຖີ່ຄື້ນວິທະຍຸ ເພື່ອເລືອກຊ່ອງຄວາມຖີ່ (Channel Frequency) ທີ່ບໍ່ມີສັນຍານລົບກວນ (ເຊັ່ນ 455.050 MHz).',
        parameterHint: 'Protocol: CHC (19200 bps) ຫຼື TrimTalk 450S | TX Power: High (2W/5W)'
      },
      {
        title: '3. ການກຳນົດຄ່າພິກັດເລີ່ມຕົ້ນຂອງສະຖານີອ້າງອີງ (Start Base Station)',
        detail:
          'ເລືອກຮູບແບບຂໍ້ມູນປັບແກ້ RTCM32 (MSM4), ກົດເລືອກ "Start Base by Known Point" (ປ້ອນຄ່າພິກັດໝຸດຄວບຄຸມ N, E, Z ທີ່ຮູ້ຄ່າແນ່ນອນ) ຫຼື "Single Point Averaging" (ສຳລັບວຽກສຳຫຼວດທົ່ວໄປ) ແລ້ວກົດ Start Base.',
        parameterHint: 'Correction Format: RTCM32 | Base TX LED: ໄຟສັນຍານກະພິບທຸກ 1 ວິນາທີ'
      },
      {
        title: '4. ການຕັ້ງຄ່າພາກຮັບວິທະຍຸ UHF ໃນເຄື່ອງ Rover ໃຫ້ກົງກັບສະຖານີ Base',
        detail:
          'ສະຫຼັບການເຊື່ອມຕໍ່ Bluetooth ມາຫາຫົວເຄື່ອງ Rover -> ເຂົ້າ Connect -> Rover -> Internal Radio -> ກຳນົດໂປຣໂຕຄໍ (CHC ຫຼື TT450S) ແລະ ຄື້ນຄວາມຖີ່ (455.050 MHz) ໃຫ້ກົງກັບສະຖານີ Base ທຸກປະການ ຈົນກວ່າສະຖານະປ່ຽນເປັນ "Fixed".',
        parameterHint: 'Rover RX LED: ໄຟກະພິບຮັບຂໍ້ມູນທຸກ 1 ວິນາທີ -> RTK Status: Fixed'
      }
    ],
    proTip:
      'ກໍລະນີໃຊ້ເຄື່ອງຮັບສັນຍານ CHCNAV ຮ່ວມກັນທັງສະຖານີ Base ແລະ ເຄື່ອງ Rover, ແນະນຳໃຫ້ກຳນົດໂປຣໂຕຄໍວິທະຍຸເປັນ "CHC" (ອັດຕາຮັບ-ສົ່ງຂໍ້ມູນທາງອາກາດ Air Baud Rate 19200 bps) ເພື່ອສົ່ງຂໍ້ມູນປັບແກ້ດາວທຽມຄົບທັງ 4 ລະບົບ (GPS+GLONASS+BeiDou+Galileo) ໄດ້ໄວ ແລະ ປະຢັດພະລັງງານແບັດເຕີຣີ.'
  },
  {
    id: 'chc-mod-5',
    number: '05',
    title: 'ການສຳຫຼວດເກັບຄ່າພິກັດພູມສັນຖານ (Point Survey), Auto-IMU 200Hz & ການວາງໝຸດ AR Stakeout',
    subtitle: 'ເຕັກນິກການໃຊ້ງານລະບົບຊົດເຊີຍມຸມອຽງອັດຕະໂນມັດ ແລະ ກ້ອງຄູ່ນຳທາງວາງໝຸດໃນ LandStar 8',
    duration: '40 ນາທີ',
    level: 'ສູງ (Advanced)',
    landStarMenuPath: 'LandStar 8 ➔ Survey ➔ Point Survey & Point Stakeout (AR)',
    summary:
      'ວິທີປະຕິບັດງານສຳຫຼວດເກັບລາຍລະອຽດພູມສັນຖານ (Topographic Survey) ດ້ວຍລະບົບຊົດເຊີຍມຸມອຽງໄມ້ໂພລອັດຕະໂນມັດ Auto-IMU 200Hz ແລະ ການວາງໝຸດພິກັດກໍ່ສ້າງດ້ວຍພາບກ້ອງຄູ່ເສມືອນຈິງ (AR Visual Stakeout).',
    steps: [
      {
        title: '1. ການເປີດໃຊ້ລະບົບຊົດເຊີຍມຸມອຽງ Auto-IMU 200Hz (Pole Tilt Compensation)',
        detail:
          'ໃນໜ້າຈໍ Survey -> Point Survey ກົດສັນຍາລັກ "IMU Tilt" ດ້ານຊ້າຍຂອງໜ້າຈໍ LandStar 8. ຍ່າງເຄື່ອນທີ່ຕາມປົກກະຕິ ຫຼື ແກວ່ງໄມ້ໂພລເບົາໆ 2–3 ວິນາທີ ສັນຍາລັກ IMU ຈະປ່ຽນເປັນສີຂຽວພ້ອມວັດແທກຄ່າພິກັດປາຍໄມ້ໂພລທັນທີ ໂດຍບໍ່ຕ້ອງຕັ້ງຟອງລະດັບນ້ຳໃຫ້ກົງກາງ.',
        parameterHint: 'Auto-IMU 200Hz: ອຽງໄມ້ໂພລວັດແທກມຸມອາຄານ/ຂອບຮ່ອງນ້ຳໄດ້ເຖິງ 60°'
      },
      {
        title: '2. ການເກັບລາຍລະອຽດພູມສັນຖານດ້ວຍລະຫັດລັກສະນະພູມປະເທດ (Feature Code / Quick Code)',
        detail:
          'ກວດສອບຄວາມສູງໄມ້ໂພລ (ເຊັ່ນ 2.000m) ແລະ ເລືອກລະຫັດ Feature Code (ເຊັ່ນ ROAD, BLDG, CL, EP) ເພື່ອໃຫ້ໂປຣແກຣມ LandStar 8 ສ້າງເສັ້ນເຊື່ອມຕໍ່ຈຸດພິກັດ (Linework / Polyline) ອັດຕະໂນມັດເທິງແຜນຜັງ CAD ຂະນະເກັບຂໍ້ມູນພາກສະໜາມ.',
        parameterHint: 'Quick Codes: ບັນທຶກຄ່າພິກັດພ້ອມຂຶ້ນຮູບແຜນຜັງເສັ້ນທາງ/ອາຄານທັນທີ'
      },
      {
        title: '3. ການວາງໝຸດພິກັດດ້ວຍລະບົບກ້ອງຄູ່ AR (AR Visual Stakeout ໃນ i93 / i89)',
        detail:
          'ເຂົ້າເມນູ Survey -> Point Stakeout -> ເລືອກຈຸດພິກັດທີ່ຕ້ອງການວາງໝຸດ -> ກົດໄອຄອນ "AR Camera". ກ້ອງໜ້າຈະສະແດງລູກສອນນຳທາງ 3 ມິຕິເທິງພາບສະໜາມຈິງ ແລະ ສະຫຼັບເປັນກ້ອງສ່ອງລຸ່ມອັດຕະໂນມັດເມື່ອເຂົ້າໃກ້ຈຸດໝຸດໃນໄລຍະ < 1.5 ແມັດ.',
        parameterHint: 'AR Stakeout Precision: ຊ່ວຍໃຫ້ການວາງໝຸດພາກສະໜາມໄວຂຶ້ນກວ່າ 50%'
      }
    ],
    proTip:
      'ກ່ອນເປີດໃຊ້ໂໝດຊົດເຊີຍມຸມອຽງ Auto-IMU ຫຼື ໂໝດວາງໝຸດ AR Stakeout ທຸກຄັ້ງ, ຜູ້ສຳຫຼວດຕ້ອງກວດສອບວ່າຄ່າຄວາມສູງໄມ້ໂພລ (Pole Height) ທີ່ປ້ອນໃນໂປຣແກຣມ LandStar 8 ກົງກັບຄວາມຍາວຕົວຈິງຂອງໄມ້ໂພລ (ເຊັ່ນ 1.800m ຫຼື 2.000m) ຢ່າງຖືກຕ້ອງ 100% ເພາະສົມຜົນຄຳນວນມຸມອຽງອີງຕາມຄ່າຄວາມຍາວໄມ້ໂພລ.'
  },
  {
    id: 'chc-mod-6',
    number: '06',
    title: 'ການປັບແປງຄ່າພິກັດທ້ອງຖິ່ນ (Site Calibration), ການສົ່ງອອກໄຟລ໌ CAD & ການບຳລຸງຮັກສາ',
    subtitle: 'ການຜູກຄ່າພິກັດເຂົ້າກັບໝຸດຄວບຄຸມໂຄງການ ແລະ ການສົ່ງອອກຂໍ້ມູນສຳຫຼວດຈາກ LandStar 8',
    duration: '30 ນາທີ',
    level: 'ສູງ (Advanced)',
    landStarMenuPath: 'LandStar 8 ➔ Tools ➔ Site Calibration & Project ➔ Export',
    summary:
      'ຂັ້ນຕອນການຄຳນວນຄ່າພາຣາມິເຕີປັບແປງພິກັດທ້ອງຖິ່ນ (Site Calibration / Localization) ເພື່ອໃຫ້ຄ່າພິກັດ GNSS ກົງກັບລະບົບໝຸດຄວບຄຸມເດີມຂອງໂຄງການກໍ່ສ້າງ ແລະ ວິທີສົ່ງອອກຂໍ້ມູນໄປໃຊ້ໃນໂປຣແກຣມອອກແບບວິສະວະກຳ.',
    steps: [
      {
        title: '1. ການຄຳນວນປັບແປງພິກັດທ້ອງຖິ່ນ (Tools ➔ Site Calibration)',
        detail:
          'ເມື່ອຕ້ອງການປັບຄ່າພິກັດດາວທຽມ GNSS ໃຫ້ກົງກັບລະບົບໝຸດຄວບຄຸມທ້ອງຖິ່ນ (Local Grid): ນຳເອົາເຄື່ອງ Rover ໄປຮັງວັດເກັບຄ່າພິກັດ GNSS ເທິງໝຸດຄວບຄຸມພາກສະໜາມຢ່າງໜ້ອຍ 3–4 ຈຸດ ແລ້ວຈັບຄູ່ກັບຄ່າພິກັດໝຸດອ້າງອີງ (Known Point) ໃນເມນູ Tools -> Site Calibration ແລະ ກວດສອບຄ່າຄວາມຄາດເຄື່ອນຄົງເຫຼືອ (Residuals).',
        parameterHint: 'Calibration Residuals: Horizontal ≤ 0.015 m | Vertical ≤ 0.020 m'
      },
      {
        title: '2. ການສົ່ງອອກຂໍ້ມູນຄ່າພິກັດ ແລະ ແຜນຜັງ (Project ➔ Export)',
        detail:
          'ເຂົ້າເມນູ Project -> Export -> ເລືອກຮູບແບບໄຟລ໌ມາດຕະຖານທີ່ຕ້ອງການ ເຊັ່ນ "CSV (P, N, E, Z, Code)" ສຳລັບໂປຣແກຣມຄຳນວນສຳຫຼວດ, "DXF / DWG" ສຳລັບ AutoCAD Civil 3D, ຫຼື "KML / SHP" ສຳລັບລະບົບແຜນທີ່ GIS ແລະ Google Earth.',
        parameterHint: 'Export Directory: /Internal Storage/CHCNAV/LandStar8/Export/'
      },
      {
        title: '3. ການກວດສອບໄຟສັນຍານສະຖານະ LED ແລະ ການບຳລຸງຮັກສາເຄື່ອງມືສຳຫຼວດ',
        detail:
          'ສັງເກດໄຟສັນຍານ LED ໜ້າເຄື່ອງ CHCNAV: ໄຟດາວທຽມກະພິບສີຂຽວ (ຮັບສັນຍານດາວທຽມປົກກະຕິ), ໄຟ Data Link ກະພິບທຸກ 1 ວິນາທີ (ຮັບ-ສົ່ງຂໍ້ມູນປັບແກ້ RTCM ປົກກະຕິ). ຫຼັງສຳເລັດວຽກພາກສະໜາມໃນລະດູຝົນ ໃຫ້ເຊັດທຳຄວາມສະອາດຕົວເຄື່ອງ ແລະ ຊ່ອງສາກ USB Type-C ໃຫ້ແຫ້ງກ່ອນເກັບເຂົ້າກ່ອງນິລະໄພ.',
        parameterHint: 'Charging: PD Fast Charge USB Type-C | Web UI Config: 192.168.1.1'
      }
    ],
    proTip:
      'ຫາກຕ້ອງການອັບເດດໂປຣແກຣມ LandStar 8, ອັບເດດເຟີມແວເຄື່ອງຮັບສັນຍານ (Firmware) ຫຼື ກວດສອບຄ່າມາດຕະຖານເຄື່ອງ CHCNAV i93/i89/i73+ ສາມາດຕິດຕໍ່ສູນບໍລິການເຕັກນິກ UniqTek Co., Ltd (ຕົວແທນຈຳໜ່າຍ ແລະ ສູນບໍລິການຢ່າງເປັນທາງການໃນ ສປປ ລາວ).'
  }
];

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CHCNAV_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question:
      '1. ໃນໂປຣແກຣມ CHCNAV LandStar 8, ຖ້າຕ້ອງການຕັ້ງຄ່າ Rover ເພື່ອເຊື່ອມຕໍ່ສັນຍານສະຖານີ Lao National CORS (183.182.105.253:2101) ຕ້ອງເຂົ້າໄປທີ່ເມນູໃດ?',
    options: [
      'A. Project ➔ Export ➔ DXF File',
      'B. Connect ➔ Rover ➔ Work Mode (Data Link: PDA Network / Protocol: NTRIP)',
      'C. Cogo ➔ Inverse Calculation',
      'D. Tools ➔ Volume Calculation'
    ],
    correctIndex: 1,
    explanation:
      'ໃນ LandStar 8 ການຕັ້ງຄ່າຮັບສັນຍານ CORS ແມ່ນເຂົ້າທີ່ເມນູ Connect ➔ Rover ➔ Work Mode ແລ້ວເລືອກ Data Link ເປັນ PDA Network (ຫຼື Receiver Network) ແລະ ຕັ້ງ Protocol ເປັນ NTRIP (IP: 183.182.105.253, Port: 2101).'
  },
  {
    id: 2,
    question:
      '2. ລະບົບຊົດເຊີຍຄວາມອຽງ Auto-IMU 200Hz ໃນເຄື່ອງ CHCNAV i93, i89 ແລະ i73+ ມີຈຸດເດັ່ນແນວໃດເມື່ອໃຊ້ງານຮ່ວມກັບ LandStar 8?',
    options: [
      'A. ຕ້ອງໝຸນໄມ້ໂພລເປັນວົງມົນ 5 ນາທີທຸກຄັ້ງກ່ອນວັດແທກ',
      'B. ບໍ່ຕ້ອງຄາລິເບຣດທິດເໜືອ ພຽງແຕ່ຍ່າງປົກກະຕິ ຫຼື ແກວ່ງໄມ້ໂພລ 2–3 ວິນາທີກໍພ້ອມວັດແທກມຸມອຽງເຖິງ 60°',
      'C. ໃຊ້ງານໄດ້ສະເພາະຕອນປິດສັນຍານ RTK ເທົ່ານັ້ນ',
      'D. ບໍ່ຈຳເປັນຕ້ອງປ້ອນຄວາມສູງໄມ້ໂພລ (Pole Height)'
    ],
    correctIndex: 1,
    explanation:
      'ລະບົບ CHCNAV Auto-IMU 200Hz ບໍ່ໄດ້ຮັບຜົນກະທົບຈາກສະໜາມແມ່ເຫຼັກ ແລະ ພ້ອມໃຊ້ງານພາຍໃນ 3 ວິນາທີໂດຍບໍ່ຕ້ອງຄາລິເບຣດ ແຕ່ຜູ້ໃຊ້ຕ້ອງປ້ອນ Pole Height ໃນ LandStar 8 ໃຫ້ກົງກັບຄວາມຍາວໄມ້ໂພລຕົວຈິງ.'
  },
  {
    id: 3,
    question:
      '3. ຟີເຈີກ້ອງຄູ່ (Dual-Camera) ໃນເຄື່ອງ CHCNAV i93 ແລະ i89 ຊ່ວຍວຽກວາງໝຸດກໍ່ສ້າງ (Point Stakeout) ໃນໂປຣແກຣມ LandStar 8 ແນວໃດ?',
    options: [
      'A. ສະແດງພາບຈິງ AR Visual Navigation ຊ້ອນທັບລູກສອນນຳທາງ ແລະ ຈຸດໝຸດເທິງພື້ນດິນຈິງ ພ້ອມສະຫຼັບກ້ອງລຸ່ມອັດຕະໂນມັດເມື່ອເຂົ້າໃກ້ຈຸດ',
      'B. ໃຊ້ສຳລັບຖ່າຍຮູບໃບໜ້າຜູ້ໃຊ້ງານເທົ່ານັ້ນ',
      'C. ໃຊ້ແທນເສົາອາກາດວິທະຍຸ UHF',
      'D. ໃຊ້ສຳລັບສາກແບັດເຕີຣີແສງຕາເວັນ'
    ],
    correctIndex: 0,
    explanation:
      'ກ້ອງຄູ່ຂອງ CHCNAV i93/i89 ເຮັດວຽກຮ່ວມກັບໂໝດ AR Stakeout ໃນ LandStar 8 ໂດຍກ້ອງໜ້ານຳທາງໄລຍະໄກ ແລະ ກ້ອງລຸ່ມສະແດງຈຸດປາຍໄມ້ໂພລທຽບກັບຕຳແໜ່ງໝຸດເປົ້າໝາຍຢ່າງຊັດເຈນ.'
  },
  {
    id: 4,
    question:
      '4. ເມື່ອຕັ້ງສະຖານີ Base ແລະ Rover ດ້ວຍວິທະຍຸພາຍໃນ (Internal UHF Radio) ລະຫວ່າງເຄື່ອງ CHCNAV ດ້ວຍກັນ, ໂປຣໂຕຄໍວິທະຍຸໃດໃນ LandStar 8 ທີ່ໃຫ້ປະສິດທິພາບສູງສຸດ?',
    options: [
      'A. ໂປຣໂຕຄໍ CHC (Air Baud Rate 19200 bps) ຮູບແບບຂໍ້ມູນ RTCM32',
      'B. ໂປຣໂຕຄໍ Bluetooth Low Energy',
      'C. ໂປຣໂຕຄໍ NMEA-0183 GSV',
      'D. ໂປຣໂຕຄໍ Wi-Fi Direct 5GHz'
    ],
    correctIndex: 0,
    explanation:
      'ໂປຣໂຕຄໍວິທະຍຸ "CHC" (19200 bps) ຖືກອອກແບບສະເພາະສຳລັບຮັບ-ສົ່ງຂໍ້ມູນປັບແກ້ RTCM32 MSM ຄົບທຸກກຸ່ມດາວທຽມລະຫວ່າງເຄື່ອງ CHCNAV ດ້ວຍຄວາມໄວສູງ ແລະ ປະຢັດພະລັງງານ.'
  },
  {
    id: 5,
    question:
      '5. ໃນການສ້າງໂຄງການໃໝ່ໃນ LandStar 8 ສຳລັບພື້ນທີ່ນະຄອນຫຼວງວຽງຈັນ, ຫຼວງພະບາງ ຫຼື ຈຳປາສັກ ຕ້ອງເລືອກລະບົບພິກັດໃດ?',
    options: [
      'A. Predefined ➔ WGS84 / UTM Zone 48N (Central Meridian 105°E)',
      'B. Predefined ➔ WGS84 / UTM Zone 47S',
      'C. Predefined ➔ Beijing 1954 Zone 20',
      'D. Predefined ➔ NAD83 UTM Zone 10N'
    ],
    correctIndex: 0,
    explanation:
      'ພື້ນທີ່ ສປປ ລາວ ທີ່ມີຄ່າເສັ້ນແວງ (Longitude) ຕັ້ງແຕ່ 102°E ຫາ 108°E ແມ່ນຢູ່ໃນເຂດ WGS84 / UTM Zone 48N (CM 105°E).'
  },
  {
    id: 6,
    question:
      '6. ຖ້າຕ້ອງການຜູກຄ່າພິກັດ GNSS ເຂົ້າກັບລະບົບໝຸດຄວບຄຸມທ້ອງຖິ່ນຂອງໂຄງການກໍ່ສ້າງ (Local Grid) ໃນ LandStar 8 ຕ້ອງໃຊ້ເຄື່ອງມືໃດ?',
    options: [
      'A. Tools ➔ Site Calibration (ວັດແທກຈັບຄູ່ໝຸດຄວບຄຸມ ແລະ ກວດຄ່າ Residuals)',
      'B. Connect ➔ Antenna Settings',
      'C. Project ➔ Code Library',
      'D. Survey ➔ Auto Topo by Time'
    ],
    correctIndex: 0,
    explanation:
      'ເມນູ Tools ➔ Site Calibration ໃນ LandStar 8 ໃຊ້ສຳລັບຄຳນວນຄ່າ Parameter ແປງພິກັດລະຫວ່າງ WGS84 ກັບພິກັດໝຸດຄວບຄຸມທ້ອງຖິ່ນຂອງໂຄງການ.'
  }
];

interface TrainingSessionItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  equipmentUsed: string;
  maxSeats: number;
  enrolledNames: string[];
}

const INITIAL_SESSIONS: TrainingSessionItem[] = [
  {
    id: 'CHC-TRN-01',
    title: 'ການໃຊ້ງານ CHCNAV i93 / i89 Visual IMU-RTK & LandStar 8 ເຊື່ອມຕໍ່ Lao National CORS',
    date: '2025-03-05',
    time: '09:00 - 16:00',
    location: 'ສູນຝຶກອົບຮົມ UniqTek Services (ນະຄອນຫຼວງວຽງຈັນ)',
    instructor: 'ສົມພອນ ເພັດດາລາ (CHCNAV Certified Engineer)',
    equipmentUsed: 'CHCNAV i93 Visual RTK + i89 + HCE600 (LandStar 8)',
    maxSeats: 15,
    enrolledNames: ['ສົມພອນ ເພັດດາລາ', 'ວິໄລພອນ ແກ້ວມະນີ', 'ອານຸສອນ ສີຫາວົງ']
  },
  {
    id: 'CHC-TRN-02',
    title: 'ເຕັກນິກການຕັ້ງສະຖານີ CHCNAV iBase UHF 5W, Site Calibration & AR CAD Stakeout ໃນ LandStar 8',
    date: '2025-03-14',
    time: '08:30 - 16:30',
    location: 'ສະໜາມທົດລອງພາກສະໜາມ ດອນໜູນ - ໄຊທານີ',
    instructor: 'ອານຸສອນ ສີຫາວົງ (Chief Survey Instructor)',
    equipmentUsed: 'CHCNAV iBase + i73+ / i89 + HCE600 (LandStar 8 v8.1)',
    maxSeats: 12,
    enrolledNames: ['ບຸນມີ ໄຊຍະສອນ', 'ທະວີສັກ ພົມມະວົງ']
  }
];

export const TrainingView: React.FC = () => {
  const { profile, user, logUserOperation, pushLocalNotification } = useApp();

  const [activeTab, setActiveTab] = useState<
    'products' | 'modules' | 'simulator' | 'quiz' | 'sessions'
  >('modules');

  const [selectedProductId, setSelectedProductId] = useState<string>('i93');

  // Module completion persistence
  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('uniqtek_chcnav_completed_modules');
      return saved ? JSON.parse(saved) : ['chc-mod-1'];
    } catch {
      return ['chc-mod-1'];
    }
  });
  const [expandedModuleId, setExpandedModuleId] = useState<string>('chc-mod-1');

  useEffect(() => {
    try {
      localStorage.setItem(
        'uniqtek_chcnav_completed_modules',
        JSON.stringify(completedModules)
      );
    } catch {
      // ignore storage errors
    }
  }, [completedModules]);

  // Interactive CHCNAV HCE600 + LandStar 8 Simulator state
  const [simReceiverModel, setSimReceiverModel] = useState<'i93' | 'i89' | 'i73+'>('i93');
  const [simMode, setSimMode] = useState<'ntrip' | 'uhf'>('ntrip');
  const [simHost, setSimHost] = useState<string>(CORS_NTRIP_HOST);
  const [simPort, setSimPort] = useState<string>(String(CORS_NTRIP_PORT));
  const [simStationId, setSimStationId] = useState<string>('DOL1');
  const [simSendGga, setSimSendGga] = useState<boolean>(true);
  const [simUhfFreq, setSimUhfFreq] = useState<string>('455.050');
  const [simUhfProtocol, setSimUhfProtocol] = useState<string>('CHC (19200 bps)');
  const [simPoleHeight, setSimPoleHeight] = useState<string>('2.000');
  const [simImuTilt, setSimImuTilt] = useState<boolean>(true);
  const [simArVisual, setSimArVisual] = useState<boolean>(true);
  const [simFeatureCode, setSimFeatureCode] = useState<string>('TOPO');
  const [simUtmZone, setSimUtmZone] = useState<'48N' | '47N'>('48N');
  const [simState, setSimState] = useState<'IDLE' | 'SINGLE' | 'FLOAT' | 'FIXED' | 'ERROR'>('FIXED');
  const [simFeedback, setSimFeedback] = useState<string>(
    'LandStar 8 Voice: "RTK Fixed" — ເຊື່ອມຕໍ່ CHCNAV i93 ກັບ DOL1_RTCM32 (183.182.105.253:2101) ສຳເລັດ!'
  );
  const [recordedPoints, setRecordedPoints] = useState<
    Array<{
      ptId: string;
      code: string;
      station: string;
      northing: string;
      easting: string;
      elev: string;
      hrms: string;
      status: string;
    }>
  >([
    {
      ptId: 'PT1',
      code: 'BM',
      station: 'DOL1_RTCM32',
      northing: '1988142.318',
      easting: '249384.612',
      elev: '171.842',
      hrms: '0.008m',
      status: 'Fixed (Auto-IMU)'
    }
  ]);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Training Sessions state
  const [sessions, setSessions] = useState<TrainingSessionItem[]>(() => {
    try {
      const raw = localStorage.getItem('uniqtek_chcnav_training_sessions');
      return raw ? JSON.parse(raw) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('2025-03-25');
  const [newSessionTime, setNewSessionTime] = useState('09:00 - 16:00');
  const [newSessionLocation, setNewSessionLocation] = useState('');
  const [newSessionInstructor, setNewSessionInstructor] = useState(
    profile.name || 'ສົມພອນ ເພັດດາລາ'
  );
  const [newSessionEquipment, setNewSessionEquipment] = useState(
    'CHCNAV i93 / i89 + HCE600 (LandStar 8)'
  );

  useEffect(() => {
    try {
      localStorage.setItem('uniqtek_chcnav_training_sessions', JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  const stationOptions = useMemo(() => {
    return Object.entries(CORS_COORDINATES).map(([id, info]) => ({
      id,
      ...info
    }));
  }, []);

  const selectedStationRef = useMemo(() => {
    return (
      CORS_COORDINATES[simStationId] || {
        lat: 17.975718,
        lng: 102.633142,
        elevation: 171.8,
        province: 'ນະຄອນຫຼວງວຽງຈັນ',
        satellites: 36,
        mountpoint: 'DOL1_RTCM32'
      }
    );
  }, [simStationId]);

  const activeProduct = useMemo(
    () => CHCNAV_PRODUCTS.find((p) => p.id === selectedProductId) || CHCNAV_PRODUCTS[0],
    [selectedProductId]
  );

  const handleToggleModuleComplete = (modId: string, modTitle: string) => {
    setCompletedModules((prev) => {
      const exists = prev.includes(modId);
      const next = exists ? prev.filter((id) => id !== modId) : [...prev, modId];
      if (!exists) {
        logUserOperation(
          'ສຳເລັດບົດຮຽນຝຶກອົບຮົມ CHCNAV & LandStar 8',
          `ຮຽນຈົບບົດຮຽນ: ${modTitle}`,
          'system'
        );
      }
      return next;
    });
  };

  const handleRunRtkSimulation = () => {
    if (simMode === 'ntrip') {
      if (simHost.trim() !== CORS_NTRIP_HOST || simPort.trim() !== String(CORS_NTRIP_PORT)) {
        setSimState('ERROR');
        setSimFeedback(
          `LandStar 8 Alert: ເຊື່ອມຕໍ່ NTRIP ບໍ່ສຳເລັດ! ກະລຸນາກວດສອບ Address (${CORS_NTRIP_HOST}) ແລະ Port (${CORS_NTRIP_PORT}) ໃນເມນູ Connect > Rover.`
        );
        return;
      }
      if (!simSendGga) {
        setSimState('SINGLE');
        setSimFeedback(
          'LandStar 8 Notice: ເຊື່ອມຕໍ່ NTRIP Caster ແລ້ວ ແຕ່ຍັງບໍ່ໄດ້ໝາຍຖືກ "Auto Send GGA" — ເຄື່ອງຄ້າງຢູ່ສະຖານະ SINGLE.'
        );
        return;
      }
    } else {
      const freq = parseFloat(simUhfFreq);
      if (isNaN(freq) || freq < 410 || freq > 470) {
        setSimState('ERROR');
        setSimFeedback(
          'LandStar 8 Alert: ຄວາມຖີ່ວິທະຍຸ Internal UHF ບໍ່ຖືກຕ້ອງ! ກະລຸນາຕັ້ງຢູ່ໃນຊ່ວງ 410.000 - 470.000 MHz.'
        );
        return;
      }
    }

    setSimState('FLOAT');
    setSimFeedback(
      `LandStar 8: ກຳລັງຮັບຂໍ້ມູນ RTCM32 ເຂົ້າຫົວເຄື່ອງ CHCNAV ${simReceiverModel} (iStar 1408 Channels)...`
    );

    setTimeout(() => {
      setSimState('FIXED');
      const recommendedZone = selectedStationRef.lng < 102.0 ? '47N' : '48N';
      const zoneNotice =
        simUtmZone !== recommendedZone
          ? ` (ຄຳແນະນຳ LandStar 8: ພື້ນທີ່ ${selectedStationRef.province} ແນະນຳໃຫ້ເລືອກ UTM Zone ${recommendedZone})`
          : '';
      setSimFeedback(
        simMode === 'ntrip'
          ? `LandStar 8 Voice: "RTK Fixed"! CHCNAV ${simReceiverModel} ເຊື່ອມຕໍ່ ${
              selectedStationRef.mountpoint || `${simStationId}_RTCM32`
            } (${selectedStationRef.province}) • HRMS: 0.008m, VRMS: 0.013m${zoneNotice}`
          : `LandStar 8 Voice: "RTK Fixed"! CHCNAV ${simReceiverModel} ຮັບສັນຍານວິທະຍຸ iBase ${simUhfFreq} MHz (${simUhfProtocol}) • HRMS: 0.008m`
      );
    }, 600);
  };

  const handleRecordSimulatedPoint = () => {
    if (simState !== 'FIXED') {
      setSimFeedback(
        'LandStar 8 Warning: ສະຖານະຍັງບໍ່ເປັນ "Fixed"! ກະລຸນາກົດ Apply ເຊື່ອມຕໍ່ສັນຍານກ່ອນກົດບັນທຶກຈຸດພິກັດ.'
      );
      return;
    }
    const nextNum = recordedPoints.length + 1;
    const ptId = `PT${nextNum}`;
    const poleH = parseFloat(simPoleHeight) || 2.0;
    const northing = (selectedStationRef.lat * 110640 + Math.random() * 10).toFixed(3);
    const easting = ((selectedStationRef.lng - 100) * 96500 + Math.random() * 10).toFixed(3);
    const elev = ((selectedStationRef.elevation || 175) - poleH + Math.random() * 0.02).toFixed(3);

    setRecordedPoints((prev) => [
      {
        ptId,
        code: simFeatureCode,
        station:
          simMode === 'ntrip'
            ? selectedStationRef.mountpoint || `${simStationId}_RTCM32`
            : `UHF-${simUhfFreq}`,
        northing,
        easting,
        elev,
        hrms: '0.008m',
        status: simImuTilt ? 'Fixed (Auto-IMU)' : 'Fixed'
      },
      ...prev
    ]);
    setSimFeedback(
      `LandStar 8 Voice: "Point Stored" — ບັນທຶກຈຸດ ${ptId} (Code: ${simFeatureCode}) ລົງໃນໂຄງການຮຽບຮ້ອຍແລ້ວ!`
    );
  };

  const quizScore = useMemo(() => {
    let correct = 0;
    CHCNAV_QUIZ_QUESTIONS.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: CHCNAV_QUIZ_QUESTIONS.length,
      percentage: Math.round((correct / CHCNAV_QUIZ_QUESTIONS.length) * 100)
    };
  }, [quizAnswers]);

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    logUserOperation(
      'ສົ່ງແບບທົດສອບການຝຶກອົບຮົມ CHCNAV & LandStar 8',
      `ຜູ້ເຂົ້າສອບ: ${profile.name || user} • ຄະແນນ: ${quizScore.correct}/${quizScore.total} (${quizScore.percentage}%)`,
      'system'
    );
  };

  const handleEnrollSession = (sessionId: string) => {
    const traineeName = profile.name || user || 'ຊ່າງເຕັກນິກ UniqTek';
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        if (s.enrolledNames.includes(traineeName)) return s;
        return {
          ...s,
          enrolledNames: [...s.enrolledNames, traineeName]
        };
      })
    );
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      logUserOperation(
        'ລົງທະບຽນເຂົ້າຮ່ວມຝຶກອົບຮົມ CHCNAV & LandStar 8',
        `ຫຼັກສູດ: ${target.title} (${target.date}) • ຜູ້ລົງທະບຽນ: ${traineeName}`,
        'system'
      );
      pushLocalNotification({
        title: '🎓 ລົງທະບຽນຝຶກອົບຮົມ CHCNAV & LandStar 8 ສຳເລັດ',
        message: `${traineeName} ລົງທະບຽນເຂົ້າຮ່ວມ "${target.title}" ວັນທີ ${target.date}`,
        category: 'project_status',
        newStatus: 'ລົງທະບຽນແລ້ວ'
      });
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim() || !newSessionLocation.trim()) return;
    const id = `CHC-TRN-0${sessions.length + 1}`;
    const created: TrainingSessionItem = {
      id,
      title: newSessionTitle.trim(),
      date: newSessionDate,
      time: newSessionTime,
      location: newSessionLocation.trim(),
      instructor: newSessionInstructor.trim() || 'ສົມພອນ ເພັດດາລາ',
      equipmentUsed: newSessionEquipment.trim() || 'CHCNAV i93 / i89 + HCE600 (LandStar 8)',
      maxSeats: 15,
      enrolledNames: [profile.name || 'ສົມພອນ ເພັດດາລາ']
    };
    setSessions((prev) => [created, ...prev]);
    setNewSessionTitle('');
    setNewSessionLocation('');
    setShowAddSessionModal(false);
    logUserOperation(
      'ເປີດຮອບຝຶກອົບຮົມ CHCNAV & LandStar 8 ໃໝ່',
      `ລະຫັດ: ${id}, ຫົວຂໍ້: ${created.title} (${created.date})`,
      'system'
    );
  };

  const progressPercentage = Math.round(
    (completedModules.length / CHCNAV_TRAINING_MODULES.length) * 100
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-blue-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <GraduationCap className="w-4 h-4" />
                CHCNAV × LANDSTAR 8 TRAINING CENTER
              </span>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 rounded-md">
                i93 • i89 • i73+ • iBase • HCE600
              </span>
              <span className="text-xs font-mono text-blue-200 bg-white/10 px-2.5 py-1 rounded-md">
                Lao CORS: {CORS_NTRIP_HOST}:{CORS_NTRIP_PORT}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              ລະບົບຝຶກອົບຮົມຜະລິດຕະພັນ CHCNAV GNSS RTK & ໂປຣແກຣມ LandStar 8
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ຄູ່ມືເຕັກນິກການໃຊ້ງານເຄື່ອງຮັບສັນຍານດາວທຽມສຳຫຼວດ CHCNAV (i93 Visual RTK, i89, i73+, iBase, HCE600) ຮ່ວມກັບໂປຣແກຣມ{' '}
              <strong className="text-amber-300">LandStar 8</strong> ຕັ້ງແຕ່ການກຳນົດລະບົບພິກັດອ້າງອີງ, ການເຊື່ອມຕໍ່ໂຄງຂ່າຍສະຖານີ
              Lao National CORS (<span className="font-mono text-white">{CORS_SERVER_PORTAL_URL}</span>
              ), ການຮັງວັດຊົດເຊີຍມຸມອຽງ Auto-IMU 200Hz ຈົນເຖິງການວາງໝຸດພິກັດ AR Visual Stakeout.
            </p>
          </div>

          {/* Personal Training Progress Card */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 min-w-[235px] shrink-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">ຄວາມຄືບໜ້າຫຼັກສູດ LandStar 8</span>
              <span className="font-bold text-emerald-300">
                {completedModules.length}/{CHCNAV_TRAINING_MODULES.length} ບົດ ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2.5">
              <span>ຜູ້ຮຽນ: {profile.name || user}</span>
              {progressPercentage === 100 && (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  ຈົບຫຼັກສູດ!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-white/10">
          {[
            {
              id: 'modules' as const,
              label: '1. ຄູ່ມື LandStar 8 (6 ບົດ)',
              icon: BookOpen
            },
            {
              id: 'products' as const,
              label: '2. ຜະລິດຕະພັນ CHCNAV',
              icon: Cpu
            },
            {
              id: 'simulator' as const,
              label: '3. ຈຳລອງໜ້າຈໍ LandStar 8',
              icon: Sliders
            },
            {
              id: 'quiz' as const,
              label: '4. ທົດສອບ & ໃບຢັ້ງຢືນ',
              icon: Award
            },
            {
              id: 'sessions' as const,
              label: '5. ຕາຕະລາງຝຶກພາກສະໜາມ',
              icon: Calendar
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Structured CHCNAV & LandStar 8 Training Modules */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                ຫຼັກສູດການໃຊ້ງານເຄື່ອງ CHCNAV GNSS & ໂປຣແກຣມ LandStar 8 (6 ບົດຮຽນມາດຕະຖານ)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ອ້າງອີງຕາມລຳດັບເມນູຕົວຈິງໃນ LandStar 8 (Project ➔ Connect ➔ Survey ➔ Tools)
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ເບິ່ງສະເປັກເຄື່ອງ CHCNAV
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>ຈຳລອງໜ້າຈໍ LandStar 8</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {CHCNAV_TRAINING_MODULES.map((mod) => {
              const isCompleted = completedModules.includes(mod.id);
              const isExpanded = expandedModuleId === mod.id;

              return (
                <div
                  key={mod.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all overflow-hidden shadow-xs ${
                    isCompleted
                      ? 'border-emerald-200 dark:border-emerald-800/70'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Module Header */}
                  <div
                    onClick={() => setExpandedModuleId(isExpanded ? '' : mod.id)}
                    className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : mod.number}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {mod.level}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {mod.landStarMenuPath}
                          </span>
                          <span className="text-[11px] text-slate-400">⏱ {mod.duration}</span>
                          {isCompleted && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ຮຽນຈົບແລ້ວ
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{mod.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Module Content */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700/70 space-y-4 bg-slate-50/40 dark:bg-slate-900/30">
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {mod.summary}
                      </p>

                      {/* Step-by-step cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mod.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-2"
                          >
                            <div className="space-y-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {step.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {step.detail}
                              </p>
                            </div>
                            {step.parameterHint && (
                              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px]">
                                {step.parameterHint}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Field Pro Tip */}
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                          <strong>ຂໍ້ແນະນຳທາງເຕັກນິກພາກສະໜາມ CHCNAV & LandStar 8 (Technical Note):</strong>{' '}
                          {mod.proTip}
                        </p>
                      </div>

                      {/* Action Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleToggleModuleComplete(mod.id, mod.title)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isCompleted ? 'ຮຽນຈົບບົດນີ້ແລ້ວ (ກົດເພື່ອຍົກເລີກ)' : 'ໝາຍວ່າຮຽນຈົບບົດນີ້ແລ້ວ'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('simulator')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          ຝຶກປະຕິບັດໃນ LandStar 8 Simulator ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CHCNAV Products & LandStar 8 Ecosystem Showcase */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              ຂໍ້ມູນເຕັກນິກຜະລິດຕະພັນ CHCNAV GNSS & ໂປຣແກຣມຄວບຄຸມ LandStar 8
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ເລືອກຮຸ່ນອຸປະກອນ CHCNAV ເພື່ອສຶກສາຄຸນສົມບັດທາງເຕັກນິກ, ລະບົບ Auto-IMU 200Hz ແລະ ການໃຊ້ງານຮ່ວມກັບ HCE600
            </p>

            {/* Product Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
              {CHCNAV_PRODUCTS.map((prod) => {
                const isSelected = prod.id === selectedProductId;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-1">
                      {prod.badge}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {prod.model}
                    </h3>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Product Detailed Spec Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {activeProduct.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                  {activeProduct.model}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {activeProduct.tagline}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (activeProduct.id === 'i93' || activeProduct.id === 'i89') {
                    setSimReceiverModel(activeProduct.id);
                  } else {
                    setSimReceiverModel('i73+');
                  }
                  setActiveTab('simulator');
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>ທົດລອງເຊື່ອມຕໍ່ຮຸ່ນນີ້ໃນ LandStar 8 Simulator</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Satellite className="w-4 h-4" />
                  <span>ຊ່ອງສັນຍານດາວທຽມ (GNSS Engine)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeProduct.channels}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Layers className="w-4 h-4" />
                  <span>ລະບົບຊົດເຊີຍຄວາມອຽງ (Auto-IMU Sensor)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeProduct.imuSpec}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Camera className="w-4 h-4" />
                  <span>ການສະແດງຜົນ AR Visual & CAD ໃນ LandStar 8</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeProduct.visualSpec}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Smartphone className="w-4 h-4" />
                  <span>ແບັດເຕີຣີ & ຄວາມທົນທານພາກສະໜາມ</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeProduct.batteryAndIp}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/70 space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                ຈຸດເດັ່ນສຳຄັນສຳລັບນັກສຳຫຼວດ UniqTek:
              </h4>
              <ul className="space-y-1.5">
                {activeProduct.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Interactive CHCNAV HCE600 + LandStar 8 Simulator */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: LandStar 8 Connect & Rover Setup Panel */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  ຈຳລອງການຕັ້ງຄ່າໂປຣແກຣມ CHCNAV LandStar 8 (HCE600 Controller)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ຝຶກຊ້ອມເມນູ Connect ➔ Rover (NTRIP {CORS_NTRIP_HOST}:{CORS_NTRIP_PORT} ຫຼື Internal UHF) ແລະ Survey ➔ Point Survey
                </p>
              </div>
            </div>

            {/* Step 1: Select CHCNAV Receiver Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                1. ເລືອກຫົວເຄື່ອງ CHCNAV ທີ່ເຊື່ອມຕໍ່ Bluetooth / NFC (Connect ➔ Device)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['i93', 'i89', 'i73+'] as const).map((mdl) => (
                  <button
                    key={mdl}
                    type="button"
                    onClick={() => setSimReceiverModel(mdl)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      simReceiverModel === mdl
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    CHCNAV {mdl}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Work Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                2. ເລືອກໂໝດ Data Link ໃນເມນູ Connect ➔ Rover ➔ Work Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSimMode('ntrip')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    simMode === 'ntrip'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-white ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Wifi className="w-4 h-4 text-indigo-600" />
                    <span>PDA Network (NTRIP Lao CORS)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    IP: {CORS_NTRIP_HOST}:{CORS_NTRIP_PORT}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSimMode('uhf')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    simMode === 'uhf'
                      ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/50 text-amber-950 dark:text-white ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <span>Internal Radio (iBase + Rover)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Protocol: CHC / TT450S UHF
                  </p>
                </button>
              </div>
            </div>

            {simMode === 'ntrip' ? (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      CORS Server Address (IP)
                    </label>
                    <input
                      type="text"
                      value={simHost}
                      onChange={(e) => setSimHost(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Port
                    </label>
                    <input
                      type="text"
                      value={simPort}
                      onChange={(e) => setSimPort(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mountpoint (ດຶງຈາກ Source Table 73 ສະຖານີທົ່ວປະເທດລາວ)
                  </label>
                  <select
                    value={simStationId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setSimStationId(nextId);
                      const info = CORS_COORDINATES[nextId];
                      if (info) {
                        setSimUtmZone(info.lng < 102.0 ? '47N' : '48N');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    {stationOptions.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.mountpoint || `${st.id}_RTCM32`} — {st.province} ({st.lat.toFixed(4)}°N,{' '}
                        {st.lng.toFixed(4)}°E)
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={simSendGga}
                    onChange={(e) => setSimSendGga(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Auto Send NMEA GGA (1s) ໄປຫາເຊີບເວີ Lao CORS</span>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Channel Frequency (MHz)
                  </label>
                  <input
                    type="text"
                    value={simUhfFreq}
                    onChange={(e) => setSimUhfFreq(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    LandStar 8 Radio Protocol
                  </label>
                  <select
                    value={simUhfProtocol}
                    onChange={(e) => setSimUhfProtocol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    <option value="CHC (19200 bps)">CHC (19200 bps - ແນະນຳສຳລັບ CHCNAV)</option>
                    <option value="TrimTalk 450S">TrimTalk 450S (9600 bps)</option>
                    <option value="Transparent EOT">Transparent EOT</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Coordinate System, Pole Height & Feature Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Coordinate System
                </label>
                <select
                  value={simUtmZone}
                  onChange={(e) => setSimUtmZone(e.target.value as '48N' | '47N')}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                >
                  <option value="48N">WGS84 UTM 48N (105°E)</option>
                  <option value="47N">WGS84 UTM 47N (99°E)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pole Bottom Height (m)
                </label>
                <input
                  type="number"
                  step="0.005"
                  value={simPoleHeight}
                  onChange={(e) => setSimPoleHeight(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Feature Code (ລະຫັດຈຸດ)
                </label>
                <select
                  value={simFeatureCode}
                  onChange={(e) => setSimFeatureCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                >
                  <option value="TOPO">TOPO (ດິນເດີມ)</option>
                  <option value="BM">BM (ໝຸດຄວບຄຸມ)</option>
                  <option value="ROAD">ROAD (ຂອບທາງ)</option>
                  <option value="BLDG">BLDG (ມຸມອາຄານ)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simImuTilt}
                  onChange={(e) => setSimImuTilt(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>ເປີດ Auto-IMU 200Hz (Pole Tilt)</span>
              </label>

              {(simReceiverModel === 'i93' || simReceiverModel === 'i89') && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simArVisual}
                    onChange={(e) => setSimArVisual(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>ເປີດກ້ອງຄູ່ AR Visual Stakeout</span>
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleRunRtkSimulation}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ກົດ Apply ເຊື່ອມຕໍ່ສັນຍານໃນ LandStar 8</span>
              </button>

              <button
                type="button"
                onClick={handleRecordSimulatedPoint}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>ກົດປຸ່ມ Measure ບັນທຶກຈຸດ ({simFeatureCode})</span>
              </button>
            </div>
          </div>

          {/* Right Column: Simulated HCE600 LandStar 8 Screen */}
          <div className="lg:col-span-5 bg-slate-950 text-white rounded-2xl p-5 border-2 border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Top Status Bar of LandStar 8 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-extrabold ${
                      simState === 'FIXED'
                        ? 'bg-emerald-500 text-slate-950'
                        : simState === 'FLOAT'
                        ? 'bg-amber-500 text-slate-950'
                        : simState === 'SINGLE'
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {simState === 'FIXED' ? 'Fixed' : simState}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                    {simImuTilt ? 'IMU: 200Hz ON' : 'IMU: OFF'}
                  </span>
                  {(simReceiverModel === 'i93' || simReceiverModel === 'i89') && simArVisual && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      AR CAM
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Satellite className="w-4 h-4" />
                    {selectedStationRef.satellites || 36}
                  </span>
                  <span>PDOP:1.1</span>
                </div>
              </div>

              {/* RMS Precision Readout */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">HRMS (ທາງຮາບ)</span>
                  <span
                    className={`font-bold ${
                      simState === 'FIXED' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {simState === 'FIXED' ? '0.008 m' : simState === 'FLOAT' ? '0.185 m' : '1.850 m'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">VRMS (ທາງດິ່ງ)</span>
                  <span
                    className={`font-bold ${
                      simState === 'FIXED' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {simState === 'FIXED' ? '0.013 m' : simState === 'FLOAT' ? '0.320 m' : '3.100 m'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Diff Delay</span>
                  <span className="font-bold text-sky-400">
                    {simState === 'FIXED' || simState === 'FLOAT' ? '1s (100%)' : '--'}
                  </span>
                </div>
              </div>

              {/* LandStar 8 Voice / Status Message */}
              <div
                className={`p-3 rounded-xl text-xs border ${
                  simState === 'FIXED'
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                    : simState === 'ERROR'
                    ? 'bg-rose-950/60 border-rose-700/60 text-rose-200'
                    : 'bg-amber-950/60 border-amber-700/60 text-amber-200'
                }`}
              >
                {simFeedback}
              </div>

              {/* Recorded Topo Points Log (CSV P,N,E,Z,Code Format) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    LandStar 8 Points (UTM {simUtmZone})
                  </span>
                  <span>Pole: {simPoleHeight}m</span>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800 max-h-40 overflow-y-auto divide-y divide-slate-800/80 font-mono text-[11px]">
                  {recordedPoints.map((pt) => (
                    <div key={pt.ptId} className="px-3 py-2 flex items-center justify-between">
                      <div>
                        <span className="text-amber-400 font-bold mr-1.5">{pt.ptId}</span>
                        <span className="text-indigo-300 mr-2">[{pt.code}]</span>
                        <span className="text-slate-300">
                          N:{pt.northing} E:{pt.easting} Z:{pt.elev}
                        </span>
                      </div>
                      <span className="text-emerald-400 text-[10px]">{pt.hrms}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>CHCNAV HCE600 • LandStar 8</span>
              <span>Device: CHCNAV {simReceiverModel}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHCNAV & LandStar 8 Competency Quiz & Printable Certificate */}
      {activeTab === 'quiz' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  ແບບທົດສອບວັດລະດັບຄວາມຮູ້ຜະລິດຕະພັນ CHCNAV GNSS & ໂປຣແກຣມ LandStar 8
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ຕອບຄຳຖາມໃຫ້ຖືກຕ້ອງຢ່າງໜ້ອຍ 4/6 ຂໍ້ ເພື່ອຮັບໃບຢັ້ງຢືນຜ່ານການຝຶກອົບຮົມ CHCNAV & LandStar 8
                </p>
              </div>
              {quizSubmitted && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                      quizScore.percentage >= 65
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    ຄະແນນຂອງທ່ານ: {quizScore.correct}/{quizScore.total} ({quizScore.percentage}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    ສອບໃໝ່
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {CHCNAV_QUIZ_QUESTIONS.map((q) => {
                const selectedIdx = quizAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5"
                  >
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, idx) => {
                        const isSelected = selectedIdx === idx;
                        const isCorrect = idx === q.correctIndex;
                        let btnStyle =
                          'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';

                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnStyle =
                              'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isSelected && !isCorrect) {
                            btnStyle =
                              'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200';
                          }
                        } else if (isSelected) {
                          btnStyle =
                            'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-500/20';
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [q.id]: idx }))
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 p-2.5 rounded-lg">
                        <strong>ຄຳອະທິບາຍ:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {!quizSubmitted && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
                >
                  ກວດຄຳຕອບ ແລະ ອອກໃບຢັ້ງຢືນ CHCNAV & LandStar 8
                </button>
              </div>
            )}
          </div>

          {/* Printable Certificate Preview */}
          {quizSubmitted && quizScore.percentage >= 65 && (
            <div className="bg-gradient-to-br from-amber-50 via-white to-indigo-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-6 sm:p-8 border-2 border-amber-400/70 shadow-lg text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-600 mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
                  UNIQTEK SERVICES × CHCNAV ACADEMY • OFFICIAL CERTIFICATE
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  ໃບຢັ້ງຢືນຜ່ານການຝຶກອົບຮົມ CHCNAV GNSS RTK & LandStar 8
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                ຢັ້ງຢືນວ່າ <strong>{profile.name || user}</strong> ({profile.role} —{' '}
                {profile.department}) ໄດ້ຜ່ານການທົດສອບມາດຕະຖານການໃຊ້ງານເຄື່ອງສຳຫຼວດ CHCNAV (i93 / i89 /
                i73+ / iBase) ແລະ ໂປຣແກຣມ <strong>LandStar 8</strong> ຮ່ວມກັບສະຖານີ Lao National CORS
                ({CORS_NTRIP_HOST}:{CORS_NTRIP_PORT}) ດ້ວຍຄະແນນ <strong>{quizScore.percentage}%</strong>.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-500 font-mono">
                <span>CERT ID: UTK-CHC-LS8-{new Date().getFullYear()}</span>
                <span>•</span>
                <span>DATE: {new Date().toLocaleDateString('en-GB')}</span>
                <span>•</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  VERIFIED BY UNIQTEK SERVICES
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>ພິມໃບຢັ້ງຢືນ (Print Certificate)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Live Field Training Sessions & Registration */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                ຕາຕະລາງຈັດຝຶກອົບຮົມພາກສະໜາມ CHCNAV & LandStar 8
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ລົງທະບຽນເຂົ້າຮ່ວມຝຶກຊ້ອມຕົວຈິງກັບທີມວິສະວະກອນ UniqTek ຫຼື ເປີດຮອບຝຶກອົບຮົມໃໝ່ໃຫ້ລູກຄ້າ
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddSessionModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ເປີດຮອບຝຶກອົບຮົມໃໝ່</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => {
              const currentTrainee = profile.name || user || 'ຊ່າງເຕັກນິກ UniqTek';
              const isEnrolled = session.enrolledNames.includes(currentTrainee);

              return (
                <div
                  key={session.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs">
                        {session.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        📅 {session.date} ({session.time})
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {session.title}
                    </h3>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>ສະຖານທີ່: {session.location}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>ວິທະຍາກອນ: {session.instructor}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>ອຸປະກອນ: {session.equipmentUsed}</span>
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        ຜູ້ລົງທະບຽນເຂົ້າຮ່ວມ ({session.enrolledNames.length}/{session.maxSeats} ທ່ານ):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {session.enrolledNames.map((name, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px]"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-semibold">
                      UniqTek Official CHCNAV Training
                    </span>
                    <button
                      type="button"
                      disabled={isEnrolled}
                      onClick={() => handleEnrollSession(session.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isEnrolled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isEnrolled ? '✓ ລົງທະບຽນແລ້ວ' : 'ລົງທະບຽນເຂົ້າຮ່ວມ'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New Training Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              ເປີດຮອບຝຶກອົບຮົມ CHCNAV & LandStar 8 ໃໝ່
            </h3>
            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ຫົວຂໍ້ຫຼັກສູດຝຶກອົບຮົມ *
                </label>
                <input
                  type="text"
                  required
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="ເຊັ່ນ: ການໃຊ້ງານ CHCNAV i93 & LandStar 8 AR Stakeout"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ວັນທີຈັດອົບຮົມ *
                  </label>
                  <input
                    type="date"
                    required
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ເວລາ
                  </label>
                  <input
                    type="text"
                    value={newSessionTime}
                    onChange={(e) => setNewSessionTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ສະຖານທີ່ຝຶກອົບຮົມ *
                </label>
                <input
                  type="text"
                  required
                  value={newSessionLocation}
                  onChange={(e) => setNewSessionLocation(e.target.value)}
                  placeholder="ເຊັ່ນ: ສະໜາມທົດລອງ UniqTek ວຽງຈັນ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ວິທະຍາກອນຜູ້ສອນ
                </label>
                <input
                  type="text"
                  value={newSessionInstructor}
                  onChange={(e) => setNewSessionInstructor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ຮຸ່ນອຸປະກອນ CHCNAV ທີ່ໃຊ້ຝຶກ
                </label>
                <input
                  type="text"
                  value={newSessionEquipment}
                  onChange={(e) => setNewSessionEquipment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  ບັນທຶກຮອບອົບຮົມ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
