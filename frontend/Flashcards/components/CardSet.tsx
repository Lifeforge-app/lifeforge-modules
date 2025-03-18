/* eslint-disable sonarjs/pseudo-random */
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'react-toastify'

import {
  APIFallbackComponent,
  Button,
  GoBackButton,
  HamburgerMenu,
  MenuItem,
  ModuleWrapper
} from '@lifeforge/ui'

import useFetch from '@hooks/useFetch'

import {
  type IFlashcardCard,
  type IFlashcardDeck
} from '../interfaces/flashcard_interfaces'
import EditCardModal from './EditCardModal'

function CardSet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [valid] = useFetch<boolean>(`flashcards/deck/valid/${id}`)
  const [containerDetails, refreshContainerDetails] = useFetch<IFlashcardDeck>(
    `flashcards/deck/get/${id}`,
    valid === true
  )
  const [cards, refreshCards] = useFetch<IFlashcardCard[]>(
    `flashcards/card/list/${id}`,
    valid === true
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editCardModalOpen, setEditCardModalOpen] = useState(false)
  const [isShowingAnswer, setIsShowingAnswer] = useState(false)
  const [notSelected, setNotSelected] = useState<number[]>([])

  useEffect(() => {
    if (typeof valid === 'boolean' && !valid) {
      toast.error('Invalid ID')
      navigate('/flashcards')
    }
  }, [valid])

  const gotoNextCard = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const gotoLastCard = () => {
    if (currentIndex - 1 >= 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const pickRandomCard = () => {
    let innerNotSelected = [...notSelected]
    if (notSelected.length === 0) {
      const newArr = Array(cards?.length)
        .fill(0)
        .map((_, i) => i)
      innerNotSelected = newArr
      setNotSelected(newArr)
    }
    const randomIndex = Math.floor(Math.random() * innerNotSelected.length)
    setCurrentIndex(innerNotSelected[randomIndex])
    setNotSelected(innerNotSelected.filter((_, i) => i !== randomIndex))
  }

  useEffect(() => {
    setCurrentIndex(0)
    setNotSelected(
      Array(cards?.length)
        .fill(0)
        .map((_, i) => i)
    )
  }, [cards])

  useEffect(() => {
    setIsShowingAnswer(false)
  }, [currentIndex])

  return (
    <ModuleWrapper>
      <div className="space-y-1">
        <GoBackButton
          onClick={() => {
            navigate('/flashcards')
          }}
        />
        <div className="flex-between flex">
          <h1
            className={clsx(
              'flex items-center gap-4 font-semibold',
              typeof containerDetails !== 'string'
                ? 'text-2xl sm:text-3xl'
                : 'text-2xl'
            )}
          >
            {(() => {
              switch (containerDetails) {
                case 'loading':
                  return (
                    <>
                      <span className="small-loader-light"></span>
                      Loading...
                    </>
                  )
                case 'error':
                  return (
                    <>
                      <Icon
                        className="mt-0.5 size-7 text-red-500"
                        icon="tabler:alert-triangle"
                      />
                      Failed to fetch data from server.
                    </>
                  )
                default:
                  return (
                    <>
                      {containerDetails.name}
                      <span className="bg-custom-500/20 text-custom-500 ml-4 rounded-full px-4 py-1.5 text-sm font-semibold">
                        {containerDetails.card_amount} cards
                      </span>
                    </>
                  )
              }
            })()}
          </h1>
          <div className="flex-center gap-2">
            <button className="text-bg-500 hover:bg-bg-800 hover:text-bg-50 rounded-md p-4 transition-all">
              <Icon className="text-xl" icon="tabler:border-corners" />
            </button>
            <HamburgerMenu>
              <MenuItem
                icon="tabler:pencil"
                text="Edit Cards"
                onClick={() => {
                  setEditCardModalOpen(true)
                }}
              />
            </HamburgerMenu>
          </div>
        </div>
      </div>
      <div className="flex-center w-full flex-1 flex-col">
        <APIFallbackComponent data={cards}>
          {cards => (
            <>
              <div className="flex-center h-1/2 w-3/5 gap-4">
                <button
                  className="flex-center h-full shrink-0 p-4"
                  onClick={gotoLastCard}
                >
                  <Icon className="text-3xl" icon="tabler:chevron-left" />
                </button>
                <div className="stack size-full">
                  <div className="card bg-custom-500 text-bg-800 h-full shadow-md">
                    <div className="card-body flex h-full flex-col">
                      <div className="flex-between card-title flex">
                        <h2 className="text-custom-800">#{currentIndex + 1}</h2>
                        <button
                          className="bg-custom-500/20 text-custom-800 rounded-md p-2"
                          onClick={() => {
                            setIsShowingAnswer(!isShowingAnswer)
                          }}
                        >
                          <Icon
                            className="size-7"
                            icon={`tabler:bulb${isShowingAnswer ? '-off' : ''}`}
                          />
                        </button>
                      </div>
                      <div className="flex-center w-full flex-1 flex-col text-center text-3xl">
                        {isShowingAnswer
                          ? cards[currentIndex]?.answer
                          : cards[currentIndex]?.question}
                      </div>
                    </div>
                  </div>
                  <div className="card bg-custom-700 text-bg-800 opacity-100! h-full shadow-sm"></div>
                  <div className="card bg-custom-900 text-bg-800 opacity-100! shadow-xs h-full"></div>
                </div>
                <button
                  className="flex-center h-full shrink-0 p-4"
                  onClick={gotoNextCard}
                >
                  <Icon className="text-3xl" icon="tabler:chevron-right" />
                </button>
              </div>
              <Button
                className="mt-12 w-1/2"
                icon="tabler:dice"
                variant="secondary"
                onClick={pickRandomCard}
              >
                Pick Random Card
              </Button>
              <EditCardModal
                cards={cards}
                deck={id}
                isOpen={editCardModalOpen}
                refreshCards={refreshCards}
                refreshContainerDetails={refreshContainerDetails}
                onClose={() => {
                  setEditCardModalOpen(false)
                }}
              />
            </>
          )}
        </APIFallbackComponent>
      </div>
    </ModuleWrapper>
  )
}

export default CardSet
