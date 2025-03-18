import _ from 'lodash'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

import {
  APIFallbackComponent,
  SidebarDivider,
  SidebarItem,
  SidebarTitle,
  SidebarWrapper
} from '@lifeforge/ui'

import { IMailInboxLabel } from '@modules/MailInbox/interfaces/mail_inbox_interfaces'

import { Loadable } from '../../../../core/interfaces/common'
import LabelList from './components/LabelList'

function Sidebar({
  isOpen,
  setOpen,
  allMailsCount,
  labels
}: {
  isOpen: boolean
  setOpen: (value: boolean) => void
  allMailsCount: number
  labels: Loadable<IMailInboxLabel[]>
}) {
  const [searchParams, setSearchParams] = useSearchParams()

  const sidebarItems = useMemo(() => {
    if (typeof labels === 'string') return labels
    return [
      {
        icon: 'tabler:inbox',
        name: 'Inbox',
        count: labels.find(l => l.name === 'INBOX')?.count
      },
      {
        icon: 'tabler:star',
        name: 'Starred',
        count: labels.find(l => l.name === 'Starred')?.count
      },
      {
        icon: 'tabler:send',
        name: 'Sent',
        count: labels.find(l => l.name === 'Sent')?.count
      },
      { icon: 'tabler:file', name: 'Draft', count: 0 },
      { icon: 'tabler:mail', name: 'All Mails', count: allMailsCount },
      {
        icon: 'tabler:trash',
        name: 'Trash',
        count: labels.find(l => l.name === 'Trash')?.count
      }
    ]
  }, [labels, allMailsCount])

  return (
    <SidebarWrapper isOpen={isOpen} setOpen={setOpen}>
      <APIFallbackComponent data={sidebarItems}>
        {sidebarItems => (
          <>
            {sidebarItems.map((item, index) => (
              <SidebarItem
                key={index}
                active={searchParams.get('label') === _.kebabCase(item.name)}
                icon={item.icon}
                name={item.name}
                namespace="modules.mailInbox"
                number={item.count}
                onCancelButtonClick={
                  item.name !== 'Inbox'
                    ? () => {
                        const newParams = new URLSearchParams(searchParams)
                        newParams.delete('label')
                        setSearchParams(newParams)
                      }
                    : undefined
                }
                onClick={() => {
                  setSearchParams({ label: _.kebabCase(item.name) })
                }}
              />
            ))}
            <SidebarDivider />
            <SidebarTitle
              actionButtonIcon="tabler:plus"
              actionButtonOnClick={() => {}}
              name="Labels"
              namespace="modules.mailInbox"
            />
            <LabelList labels={labels} />
          </>
        )}
      </APIFallbackComponent>
    </SidebarWrapper>
  )
}

export default Sidebar
