import buenosAires from "../assets/img/buenos-aires-argentina.jpg";
import lima from "../assets/img/lima-peru.jpg";
import rio from "../assets/img/rio-de-janeiro-brasil.jpg";
import sanJose from "../assets/img/san-jose-costa-rica.jpg";
import valparaiso from "../assets/img/valparaiso-chile.jpg";

export const ciudades = [
	{
		slug: "valparaiso-chile",
		city: "Valparaíso",
		country: "Chile",
		region: "Región de Valparaíso",
		image: valparaiso,
		imageScale: 1.12,
		latitude: -33.0458456,
		longitude: -71.6196749,
		description: "Una ciudad portuaria de cerros coloridos, ascensores históricos y una intensa vida cultural frente al Pacífico.",
		bestFor: "Arte, miradores y paseos junto al mar",
	},
	{
		slug: "san-jose-costa-rica",
		city: "San José",
		country: "Costa Rica",
		region: "Provincia de San José",
		image: sanJose,
		latitude: 9.9327707,
		longitude: -84.0796144,
		description: "La capital costarricense combina museos, mercados, arquitectura histórica y una puerta de entrada a la naturaleza del país.",
		bestFor: "Cultura, gastronomía y escapadas naturales",
	},
	{
		slug: "rio-de-janeiro-brasil",
		city: "Río de Janeiro",
		country: "Brasil",
		region: "Estado de Río de Janeiro",
		image: rio,
		latitude: -22.9110137,
		longitude: -43.2093727,
		description: "Una ciudad de playas, montañas y barrios llenos de ritmo, con paisajes reconocibles y muchas formas de explorar.",
		bestFor: "Playas, naturaleza y vida urbana",
	},
	{
		slug: "buenos-aires-argentina",
		city: "Buenos Aires",
		country: "Argentina",
		region: "Ciudad Autónoma de Buenos Aires",
		image: buenosAires,
		latitude: -34.6095579,
		longitude: -58.3887904,
		description: "Una capital de barrios con personalidad, cafés, librerías, arquitectura y una agenda cultural que nunca se detiene.",
		bestFor: "Gastronomía, cultura y arquitectura",
	},
	{
		slug: "lima-peru",
		city: "Lima",
		country: "Perú",
		region: "Provincia de Lima",
		image: lima,
		latitude: -12.0459808,
		longitude: -77.0305912,
		description: "La capital peruana reúne patrimonio histórico, cocina reconocida y una extensa costa para recorrer con calma.",
		bestFor: "Historia, comida y costa",
	},
];

export const LUGAR_ESTILOS = {
	attraction: { label: "Lugar turístico", color: "#0F6B78", icon: "fa-landmark", selector: ["tourism", "attraction"] },
	museum: { label: "Museo", color: "#6F42C1", icon: "fa-building-columns", selector: ["tourism", "museum"] },
	viewpoint: { label: "Mirador", color: "#E07A2D", icon: "fa-binoculars", selector: ["tourism", "viewpoint"] },
	park: { label: "Parque", color: "#198754", icon: "fa-tree", selector: ["leisure", "park"] },
	monument: { label: "Monumento", color: "#6C757D", icon: "fa-monument", selector: ["historic", "monument"] },
	gallery: { label: "Galería", color: "#B02A37", icon: "fa-image", selector: ["tourism", "gallery"] },
	restaurant: { label: "Restaurante", color: "#DC3545", icon: "fa-utensils", selector: ["amenity", "restaurant"] },
	cafe: { label: "Cafetería", color: "#795548", icon: "fa-mug-hot", selector: ["amenity", "cafe"] },
	fast_food: { label: "Comida rápida", color: "#FD7E14", icon: "fa-burger", selector: ["amenity", "fast_food"] },
	bar: { label: "Bar", color: "#0DCAF0", icon: "fa-martini-glass", selector: ["amenity", "bar"] },
	pub: { label: "Pub", color: "#6610F2", icon: "fa-beer-mug-empty", selector: ["amenity", "pub"] },
	nightclub: { label: "Club", color: "#D63384", icon: "fa-music", selector: ["amenity", "nightclub"] },
	hotel: { label: "Hotel", color: "#0D6EFD", icon: "fa-hotel", selector: ["tourism", "hotel"] },
	hostel: { label: "Hostal", color: "#20C997", icon: "fa-bed", selector: ["tourism", "hostel"] },
	guest_house: { label: "Hospedaje", color: "#087F5B", icon: "fa-house", selector: ["tourism", "guest_house"] },
	pier: { label: "Muelle", color: "#087990", icon: "fa-anchor", selector: ["man_made", "pier"] },
	marina: { label: "Marina", color: "#0AA2C0", icon: "fa-sailboat", selector: ["leisure", "marina"] },
	pedestrian: { label: "Paseo", color: "#997404", icon: "fa-person-walking", selector: ["highway", "pedestrian"] },
};

export const obtenerCiudad = (slug) => ciudades.find((ciudad) => ciudad.slug === slug);
