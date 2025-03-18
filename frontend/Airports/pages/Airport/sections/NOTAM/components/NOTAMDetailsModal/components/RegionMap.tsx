import {
  Circle,
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer
} from 'react-leaflet'

function RegionMap({
  data
}: {
  data: {
    qualification: {
      coordinates: [[number, number], { radius: number }]
    }
    content: {
      area: Array<[number, number]>
    }
  }
}) {
  return (
    <div className="mt-6 h-96 overflow-hidden rounded-md">
      <MapContainer
        center={data.qualification.coordinates[0]}
        className="h-96! w-full"
        zoom={10}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          maxZoom={20}
          subdomains={['mt1', 'mt2', 'mt3']}
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        />
        {data.content.area?.filter(e => e[0] !== 0 && e[1] !== 0)?.length >
        3 ? (
          <Polygon
            positions={data.content.area?.filter(e => e[0] !== 0 && e[1] !== 0)}
          />
        ) : (
          <>
            <Circle
              center={data.qualification.coordinates[0]}
              radius={data.qualification.coordinates[1]?.radius * 1.852 * 1000}
            />
            <CircleMarker
              center={data.qualification.coordinates[0]}
              fillOpacity={1}
              radius={2}
            />
          </>
        )}
      </MapContainer>
    </div>
  )
}

export default RegionMap
