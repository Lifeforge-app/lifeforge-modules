/* eslint-disable sonarjs/no-nested-functions */
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { APIFallbackComponent, Button, ModalWrapper } from '@lifeforge/ui'

import { usePhotosContext } from '@modules/Photos/providers/PhotosProvider'

import fetchAPI from '@utils/fetchAPI'

import { type IPhotosAlbum } from '../../interfaces/photos_interfaces'

function UpdateAlbumTagsModal({
  isOpen,
  setOpen,
  selectedAlbum
}: {
  isOpen: boolean
  setOpen: (value: boolean) => void
  selectedAlbum: IPhotosAlbum | null
}) {
  const { albumTagList, setAlbumList, refreshAlbumTagList } = usePhotosContext()
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    if (selectedAlbum) {
      setSelectedTags(selectedAlbum.tags)
    }
  }, [selectedAlbum])

  async function onSubmitButtonClick() {
    setLoading(true)

    try {
      await fetchAPI(`photos/album/tag/update-album/${selectedAlbum?.id}`, {
        method: 'PATCH',
        body: { tags: selectedTags }
      })

      setOpen(false)
      setAlbumList(prev => {
        if (typeof prev === 'string') {
          return prev
        }

        return prev.map(album => {
          if (album.id === selectedAlbum?.id) {
            return {
              ...album,
              tags: selectedTags
            }
          }

          return album
        })
      })
      refreshAlbumTagList()
    } catch {
      toast.error('Failed to update tags')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="flex-between mb-8 flex">
        <h1 className="flex items-center gap-3 text-2xl font-semibold">
          <Icon className="size-7" icon="tabler:tags" />
          Modify Tags for {selectedAlbum?.name ?? 'Album'}
        </h1>
        {!loading && (
          <button
            className="text-bg-500 hover:bg-bg-100 dark:hover:bg-bg-800 rounded-md p-2 transition-all"
            onClick={() => {
              setOpen(false)
            }}
          >
            <Icon className="size-6" icon="tabler:x" />
          </button>
        )}
      </div>
      <APIFallbackComponent data={albumTagList}>
        {albumTagList => (
          <div className="flex max-w-[50vw] flex-wrap gap-2">
            {albumTagList.map(tag => (
              <button
                key={tag.id}
                className={clsx(
                  'shadow-custom rounded-full px-4 py-1 uppercase tracking-wider transition-all',
                  selectedTags.includes(tag.id)
                    ? 'bg-custom-500/20 text-custom-500 hover:bg-custom-500/40'
                    : 'bg-bg-800 text-bg-500 hover:bg-bg-700'
                )}
                onClick={() => {
                  setSelectedTags(prev => {
                    if (prev.includes(tag.id)) {
                      return prev.filter(id => id !== tag.id)
                    } else {
                      return [...prev, tag.id]
                    }
                  })
                }}
              >
                {tag.name}
              </button>
            ))}
            <button className="bg-bg-800 text-bg-500 shadow-custom rounded-full px-4 py-1 uppercase tracking-wider">
              <Icon className="size-4" icon="tabler:plus" />
            </button>
          </div>
        )}
      </APIFallbackComponent>
      <Button
        className="mt-12"
        icon="tabler:tags"
        loading={loading}
        onClick={() => {
          onSubmitButtonClick().catch(console.error)
        }}
      >
        {!loading ? 'Update Tags' : ''}
      </Button>
    </ModalWrapper>
  )
}

export default UpdateAlbumTagsModal
