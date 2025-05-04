import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { Link } from 'react-router'

import { HamburgerMenu, MenuItem } from '@lifeforge/ui'

import { type IProjectsMEntry } from '@apps/ProjectsM/interfaces/projects_m_interfaces'

import useComponentBg from '@hooks/useComponentBg'

import { useProjectsMContext } from '../providers/ProjectsMProvider'

function EntryItem({ entry }: { entry: IProjectsMEntry }) {
  const {
    entries: {
      setExistedData,
      setModifyDataModalOpenType,
      setDeleteDataConfirmationOpen
    },
    categories: { dataQuery: categoriesQuery },
    statuses: { dataQuery: statusesQuery },
    visibilities: { dataQuery: visibilitiesQuery },
    technologies: { dataQuery: technologiesQuery }
  } = useProjectsMContext()
  const { componentBgWithHover } = useComponentBg()

  const categories = categoriesQuery.data ?? []
  const statuses = statusesQuery.data ?? []
  const visibilities = visibilitiesQuery.data ?? []
  const technologies = technologiesQuery.data ?? []

  return (
    <li
      className={clsx(
        'shadow-custom m-4 mt-0 flex items-center gap-4 rounded-lg transition-all',
        componentBgWithHover
      )}
    >
      <Link
        className="flex-between flex w-full gap-4 p-6"
        to={`/projects-m/${entry.id}`}
      >
        <div className="flex items-center gap-4">
          <div
            className="h-10 w-1 shrink-0 rounded-full"
            style={{
              backgroundColor:
                typeof statuses !== 'string'
                  ? statuses.find(l => l.id === entry.status)?.color
                  : ''
            }}
          />
          <div
            className="size-12 shrink-0 overflow-hidden rounded-lg p-2"
            style={{
              backgroundColor: entry.color + '20',
              color: entry.color
            }}
          >
            <Icon className="size-full" icon={entry.icon} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 font-semibold">
              {entry.name}

              {typeof visibilities !== 'string' && (
                <Icon
                  className="size-4"
                  icon={
                    visibilities.find(l => l.id === entry.visibility)?.icon ??
                    'tabler:eye'
                  }
                />
              )}
            </div>
            <div className="text-bg-500 text-sm">
              {typeof categories !== 'string' &&
                categories.find(l => l.id === entry.category)?.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {typeof technologies !== 'string' &&
              entry.technologies.map(tech => {
                const technology = technologies.find(l => l.id === tech)
                return (
                  <Icon
                    key={technology?.id}
                    className="size-6"
                    icon={technology?.icon ?? 'tabler:code'}
                  />
                )
              })}
          </div>
          <HamburgerMenu>
            <MenuItem
              icon="tabler:pencil"
              text="Edit"
              onClick={() => {
                setExistedData(entry)
                setModifyDataModalOpenType('update')
              }}
            />
            <MenuItem
              isRed
              icon="tabler:trash"
              text="Delete"
              onClick={() => {
                setExistedData(entry)
                setDeleteDataConfirmationOpen(true)
              }}
            />
          </HamburgerMenu>
        </div>
      </Link>
    </li>
  )
}

export default EntryItem
