import { useDebounce } from '@uidotdev/usehooks'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { toast } from 'react-toastify'

import { Button, ModalHeader, ModalWrapper, TextInput } from '@lifeforge/ui'

import fetchAPI from '@utils/fetchAPI'

import { type INotesEntry } from '../../interfaces/notes_interfaces'

function ModifyFolderModal({
  openType,
  setOpenType,
  updateNotesEntries,
  existedData
}: {
  openType: 'create' | 'update' | null
  setOpenType: React.Dispatch<React.SetStateAction<'create' | 'update' | null>>
  updateNotesEntries: () => void
  existedData: INotesEntry | null
}) {
  const { t } = useTranslation('modules.notes')
  const {
    workspace,
    subject,
    '*': path
  } = useParams<{
    workspace: string
    subject: string
    '*': string
  }>()

  const [loading, setLoading] = useState(false)
  const [folderName, setFolderName] = useState('')
  const innerOpenType = useDebounce(openType, openType === null ? 300 : 0)

  async function onSubmitButtonClick() {
    if (folderName.trim().length === 0) {
      toast.error(t('input.error.fieldEmpty'))
      return
    }

    setLoading(true)

    const entry = {
      name: folderName.trim(),
      workspace,
      type: 'folder',
      parent: path !== undefined ? path.split('/').pop() : '',
      subject
    }

    try {
      await fetchAPI(
        `notes/entries/${innerOpenType}/folder` +
          (innerOpenType === 'update' ? `/${existedData?.id}` : ''),
        {
          method: innerOpenType === 'create' ? 'POST' : 'PATCH',
          body: entry
        }
      )

      setOpenType(null)
      updateNotesEntries()
    } catch {
      toast.error(`Failed to ${innerOpenType} folder`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (innerOpenType === 'update' && existedData !== null) {
      setFolderName(existedData.name)
    } else {
      setFolderName('')
    }
  }, [innerOpenType, existedData])

  return (
    <>
      <ModalWrapper isOpen={openType !== null}>
        <ModalHeader
          icon={
            {
              create: 'tabler:plus',
              update: 'tabler:pencil'
            }[innerOpenType!]
          }
          title={`${
            {
              create: 'Create ',
              update: 'Rename '
            }[innerOpenType!]
          } folder`}
          onClose={() => {
            setOpenType(null)
          }}
        />
        <TextInput
          darker
          icon="tabler:folder"
          name="Folder Name"
          namespace="modules.notes"
          placeholder="My lovely folder"
          setValue={setFolderName}
          value={folderName}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSubmitButtonClick().catch(console.error)
            }
          }}
        />
        <Button
          icon={innerOpenType === 'create' ? 'tabler:plus' : 'tabler:pencil'}
          loading={loading}
          onClick={() => {
            onSubmitButtonClick().catch(console.error)
          }}
        >
          {innerOpenType === 'create' ? 'Create' : 'Update'}
        </Button>
      </ModalWrapper>
    </>
  )
}

export default ModifyFolderModal
