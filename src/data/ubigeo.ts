// Datos de UBIGEO: Departamento, Provincia, Distrito
export type Distrito = {
  id: string;
  nombre: string;
};

export type Provincia = {
  nombre: string;
  distritos: Distrito[];
};

export type Departamento = {
  nombre: string;
  provincias: Provincia[];
};

export const ubigeoData: Departamento[] = [
  {
    nombre: "SAN MARTIN",
    provincias: [
      {
        nombre: "MOYOBAMBA",
        distritos: [
          { id: "220101", nombre: "MOYOBAMBA" },
          { id: "220102", nombre: "CALZADA" },
          { id: "220103", nombre: "HABANA" },
          { id: "220104", nombre: "JEPELACIO" },
          { id: "220105", nombre: "SORITOR" },
          { id: "220106", nombre: "YANTALO" },
        ]
      },
      {
        nombre: "BELLAVISTA",
        distritos: [
          { id: "220201", nombre: "BELLAVISTA" },
          { id: "220202", nombre: "ALTO BIAVO" },
          { id: "220203", nombre: "BAJO BIAVO" },
          { id: "220204", nombre: "HUALLAGA" },
          { id: "220205", nombre: "SAN PABLO" },
          { id: "220206", nombre: "SAN RAFAEL" },
        ]
      },
      {
        nombre: "EL DORADO",
        distritos: [
          { id: "220301", nombre: "SAN JOSE DE SISA" },
          { id: "220302", nombre: "AGUA BLANCA" },
          { id: "220303", nombre: "SAN MARTIN" },
          { id: "220304", nombre: "SANTA ROSA" },
          { id: "220305", nombre: "SHATOJA" },
        ]
      },
      {
        nombre: "HUALLAGA",
        distritos: [
          { id: "220401", nombre: "SAPOSOA" },
          { id: "220402", nombre: "ALTO SAPOSOA" },
          { id: "220403", nombre: "EL ESLABON" },
          { id: "220404", nombre: "PISCOYACU" },
          { id: "220405", nombre: "SACANCHE" },
          { id: "220406", nombre: "TINGO DE SAPOSOA" },
        ]
      },
      {
        nombre: "LAMAS",
        distritos: [
          { id: "220501", nombre: "LAMAS" },
          { id: "220502", nombre: "ALONSO DE ALVARAD" },
          { id: "220503", nombre: "BARRANQUITA" },
          { id: "220504", nombre: "CAYNARACHI" },
          { id: "220505", nombre: "CUÑUMBUQUI" },
          { id: "220506", nombre: "PINTO RECODO" },
          { id: "220507", nombre: "RUMISAPA" },
          { id: "220508", nombre: "SAN ROQUE DE CUME" },
          { id: "220509", nombre: "SHANAO" },
          { id: "220510", nombre: "TABALOSOS" },
          { id: "220511", nombre: "ZAPATERO" },
        ]
      },
      {
        nombre: "MARISCAL CACERES",
        distritos: [
          { id: "220601", nombre: "JUANJUI" },
          { id: "220602", nombre: "CAMPANILLA" },
          { id: "220603", nombre: "HUICUNGO" },
          { id: "220604", nombre: "PACHIZA" },
          { id: "220605", nombre: "PAJARILLO" },
        ]
      },
      {
        nombre: "PICOTA",
        distritos: [
          { id: "220701", nombre: "PICOTA" },
          { id: "220702", nombre: "BUENOS AIRES" },
          { id: "220703", nombre: "CASPIZAPA" },
          { id: "220704", nombre: "PILLUANA" },
          { id: "220705", nombre: "PUCACACA" },
          { id: "220706", nombre: "SAN CRISTOBAL" },
          { id: "220707", nombre: "SAN HILARION" },
          { id: "220708", nombre: "SHAMBOYACU" },
          { id: "220709", nombre: "TINGO DE PONASA" },
          { id: "220710", nombre: "TRES UNIDOS" },
        ]
      },
      {
        nombre: "RIOJA",
        distritos: [
          { id: "220801", nombre: "RIOJA" },
          { id: "220802", nombre: "AWAJUN" },
          { id: "220803", nombre: "ELIAS SOPLIN VARGAS" },
          { id: "220804", nombre: "NUEVA CAJAMARCA" },
          { id: "220805", nombre: "PARDO MIGUEL" },
          { id: "220806", nombre: "POSIC" },
          { id: "220807", nombre: "SAN FERNANDO" },
          { id: "220808", nombre: "YORONGOS" },
          { id: "220809", nombre: "YURACYACU" },
        ]
      },
      {
        nombre: "SAN MARTIN",
        distritos: [
          { id: "220901", nombre: "TARAPOTO" },
          { id: "220902", nombre: "ALBERTO LEVEAU" },
          { id: "220903", nombre: "CACATACHI" },
          { id: "220904", nombre: "CHAZUTA" },
          { id: "220905", nombre: "CHIPURANA" },
          { id: "220906", nombre: "EL PORVENIR" },
          { id: "220907", nombre: "HUIMBAYOC" },
          { id: "220908", nombre: "JUAN GUERRA" },
          { id: "220909", nombre: "LA BANDA DE SHILCAYO" },
          { id: "220910", nombre: "MORALES" },
          { id: "220911", nombre: "PAPAPLAYA" },
          { id: "220912", nombre: "SAN ANTONIO" },
          { id: "220913", nombre: "SAUCE" },
          { id: "220914", nombre: "SHAPAJA" },
        ]
      },
      {
        nombre: "TOCACHE",
        distritos: [
          { id: "221001", nombre: "TOCACHE" },
          { id: "221002", nombre: "NUEVO PROGRESO" },
          { id: "221003", nombre: "POLVORA" },
          { id: "221004", nombre: "SHUNTE" },
          { id: "221005", nombre: "UCHIZA" },
          { id: "221006", nombre: "SANTA LUCIA" },
        ]
      },
    ]
  },
];
