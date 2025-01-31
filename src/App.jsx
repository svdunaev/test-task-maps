import { YMaps, Map, Polyline, Placemark } from '@pbe/react-yandex-maps'
import { useCallback, useState, useMemo } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { nanoid } from 'nanoid'
import './App.css'
import ListItem from './components/ListItem'

import { Container } from './components/Container'
import { Section } from './components/Section'

const API_KEY = process.env.REACT_APP_API_KEY

function App() {
  const [addresses, setAddresses] = useState([])
  const [text, setText] = useState('')

  const fetchCoords = useCallback((text) => {
    return fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${API_KEY}&format=json&geocode=${text}&results=1`,
    )
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        return data.response.GeoObjectCollection.featureMember[0].GeoObject
          .Point.pos
      })
      .then((coords) => {
        return coords.split(' ').reverse()
      })
  }, [])

  const addAddress = async (evt) => {
    if (evt.key === 'Enter' && text.trim().length) {
      const coords = await fetchCoords(text)
      setAddresses([
        ...addresses,
        {
          text,
          id: nanoid(),
          coords,
        },
      ])
      setText('')
    }
  }

  const getGeometry = (addresses) => {
    const geometry = []

    addresses.forEach((a) => geometry.push(a.coords))

    return geometry
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setAddresses((items) => {
        const activeIndex = items.findIndex((item) => item.id === active.id)
        const overIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, activeIndex, overIndex)
      })
    }
  }

  const removeAddress = (id) => {
    setAddresses((addresses) => {
      return addresses.filter((address) => address.id !== id)
    })
  }

  const itemIds = useMemo(() => addresses.map((item) => item.id), [addresses])

  return (
    <Container>
      <Section>
        <input
          value={text}
          onChange={(evt) => setText(evt.target.value)}
          onKeyDown={addAddress}
          placeholder={'Введите адрес'}
          style={{marginBottom: '2rem', lineHeight: '2.5'}}
        />
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            {addresses.map((address) => (
              <ListItem
                key={address.id}
                addressId={address.id}
                text={address.text}
                removeAddress={removeAddress}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Section>
      <Section>
        <YMaps>
          <Map
            width={'500px'}
            height={'500px'}
            state={{ center: [55.75, 37.61], zoom: 11 }}
          >
            <Polyline geometry={getGeometry(addresses)}></Polyline>
            {addresses.map((address) => (
              <Placemark
                key={address.id}
                modules={['geoObject.addon.balloon']}
                geometry={address.coords}
                options={{ draggable: true }}
                properties={{
                  balloonContentBody: `${address.text}`,
                }}
                onDragEnd={(evt) =>
                  setAddresses((prev) =>
                    prev.map((a) => {
                      if (a.id === address.id) {
                        return {
                          ...a,
                          coords: evt.get('target').geometry.getCoordinates(),
                        }
                      }
                      return a
                    }),
                  )
                }
              />
            ))}
          </Map>
        </YMaps>
      </Section>
    </Container>
  )
}

export default App
