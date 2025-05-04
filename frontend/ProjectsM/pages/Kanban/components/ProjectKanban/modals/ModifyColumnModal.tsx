import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { toast } from 'react-toastify'

import {
  Button,
  ColorInput,
  ColorPickerModal,
  IconInput,
  IconPickerModal,
  ModalHeader,
  ModalWrapper,
  TextInput
} from '@lifeforge/ui'

import { type IProjectsMKanbanColumn } from '@apps/ProjectsM/interfaces/projects_m_interfaces'

import fetchAPI from '@utils/fetchAPI'

function ModifyColumnModal({
  openType,
  setOpenType,
  existedData,
  setExistedData,
  refreshColumns
}: {
  openType: 'create' | 'update' | null
  setOpenType: React.Dispatch<React.SetStateAction<'create' | 'update' | null>>
  existedData: IProjectsMKanbanColumn | null
  setExistedData: React.Dispatch<
    React.SetStateAction<IProjectsMKanbanColumn | null>
  >
  refreshColumns: () => void
}) {
  const { t } = useTranslation('apps.projectsM')
  const { id } = useParams()
  const [columnName, setColumnName] = useState('')
  const [columnIcon, setColumnIcon] = useState('')
  const [columnColor, setColumnColor] = useState<string>('#FFFFFF')
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (openType) {
      if (openType === 'update') {
        if (existedData) {
          setColumnName(existedData.name)
          setColumnIcon(existedData.icon)
          setColumnColor(existedData.color)
        }
      } else {
        setColumnName('')
        setColumnIcon('')
        setColumnColor('#FFFFFF')
      }
    }
  }, [openType, existedData])

  async function onSubmitButtonClick() {
    if (
      columnName.trim().length === 0 ||
      !columnColor ||
      columnIcon.trim().length === 0
    ) {
      toast.error(t('input.error.fieldEmpty'))
      return
    }

    setIsLoading(true)

    try {
      await fetchAPI(
        `projects-m/kanban/columns${
          openType === 'update' ? `/${existedData?.id}` : `/${id}`
        }`,
        {
          method: openType === 'create' ? 'POST' : 'PATCH',
          body: {
            name: columnName,
            icon: columnIcon,
            color: columnColor
          }
        }
      )

      refreshColumns()
      setExistedData(null)
      setOpenType(null)
    } catch {
      toast.error(t('input.error.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <ModalWrapper className="sm:min-w-[30rem]" isOpen={openType !== null}>
        <ModalHeader
          icon={openType === 'update' ? 'tabler:pencil' : 'tabler:plus'}
          namespace="apps.projectsM"
          title={`column.${openType}`}
          onClose={() => {
            setOpenType(null)
          }}
        />
        <TextInput
          darker
          icon="tabler:book"
          name="Column name"
          namespace="apps.projectsM"
          placeholder="My Columns"
          setValue={setColumnName}
          value={columnName}
        />
        <IconInput
          icon={columnIcon}
          name="Column icon"
          namespace="apps.projectsM"
          setIcon={setColumnIcon}
          setIconSelectorOpen={setIconSelectorOpen}
        />
        <ColorInput
          color={columnColor}
          name="Column color"
          namespace="apps.projectsM"
          setColor={setColumnColor}
          setColorPickerOpen={setColorPickerOpen}
        />
        <Button
          icon={openType === 'update' ? 'tabler:pencil' : 'tabler:plus'}
          loading={isLoading}
          onClick={() => {
            onSubmitButtonClick().catch(console.error)
          }}
        >
          {openType === 'update' ? 'Update' : 'Create'}
        </Button>
      </ModalWrapper>
      <IconPickerModal
        isOpen={iconSelectorOpen}
        setOpen={setIconSelectorOpen}
        setSelectedIcon={setColumnIcon}
      />
      <ColorPickerModal
        color={columnColor}
        isOpen={colorPickerOpen}
        setColor={setColumnColor}
        setOpen={setColorPickerOpen}
      />
    </>
  )
}

export default ModifyColumnModal
