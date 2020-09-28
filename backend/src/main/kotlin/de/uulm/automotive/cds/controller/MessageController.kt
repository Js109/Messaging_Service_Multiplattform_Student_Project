package de.uulm.automotive.cds.controller

import de.uulm.automotive.cds.entities.Message
import de.uulm.automotive.cds.models.dtos.MessageDTO
import de.uulm.automotive.cds.models.dtos.MessageFilterDTO
import de.uulm.automotive.cds.models.errors.MessageBadRequestInfo
import de.uulm.automotive.cds.repositories.MessageRepository
import de.uulm.automotive.cds.services.MessageService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.transaction.Transactional
import java.util.*

@CrossOrigin("*")
@RestController
@RequestMapping("/message")
/**
 * REST-Endpoint for Messages.
 */
class MessageController(private val repository: MessageRepository, private val messageService: MessageService) {

    /**
     * REST-Endpoint to get the message with the specified id in the system.
     * See swagger definition of GET /message/{id} for more details.
     *
     * @param id Id of the message
     * @return Message with the specified id
     */
    @GetMapping("/{id}")
    fun showMessage(@PathVariable id: Long): Message {

        val message = repository.findById(id)
        if (message.isEmpty)
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find message with id $id.")

        return message.get()
    }

    /**
     * Returns the view for all messages in a period, a partial sequence search and for a specific topic.
     *
     * @param searchString A string the user is searching for as partial sequences
     * @param startTimePeriod the date which is the start date for the period of the messages to be displayed
     * @param endTimePeriod the date which is the end date for the period of the messages to be displayed
     * @param topic A string which contains the topic name of the messages to be displayed
     * @return all messages in a period, a partial sequence search and for a specific topic
     */
    @GetMapping
    @Transactional
    fun showMessages(@RequestParam searchString: String, @RequestParam startTimePeriod: String,
                     @RequestParam endTimePeriod: String, @RequestParam topic: String): Iterable<Message> {

        val tempSearchString = if (searchString.isNotEmpty()) "%$searchString%" else ""
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val dateStartTimePeriod = if (startTimePeriod.isNotEmpty()) LocalDate.parse(startTimePeriod, formatter).atTime(0, 0) else null
        val dateEndTimePeriod = if (endTimePeriod.isNotEmpty()) LocalDate.parse(endTimePeriod, formatter).atTime(23, 59) else null

        if (tempSearchString.isNotEmpty() && dateStartTimePeriod != null && dateEndTimePeriod != null && topic.isNullOrEmpty()) return repository.findAllByTitleLikeIgnoreCaseOrSenderLikeIgnoreCaseOrContentLikeIgnoreCaseAndStarttimeBetween(tempSearchString, tempSearchString, tempSearchString, dateStartTimePeriod, dateEndTimePeriod)
        if (tempSearchString.isNotEmpty() && topic.isNotEmpty() && dateStartTimePeriod == null && dateEndTimePeriod == null) return repository.findAllByTitleLikeIgnoreCaseOrSenderLikeIgnoreCaseOrContentLikeIgnoreCaseAndTopic(tempSearchString, tempSearchString, tempSearchString, topic)
        if (tempSearchString.isNullOrEmpty() && dateStartTimePeriod != null && dateEndTimePeriod != null && topic.isNotEmpty()) return repository.findAllByStarttimeBetweenAndTopic(dateStartTimePeriod, dateEndTimePeriod, topic)
        if (tempSearchString.isNotEmpty() && dateStartTimePeriod != null && dateEndTimePeriod != null && topic.isNotEmpty()) return repository.findAllByTitleLikeIgnoreCaseOrSenderLikeIgnoreCaseOrContentLikeIgnoreCaseAndStarttimeBetweenAndTopic(tempSearchString, tempSearchString, tempSearchString, dateStartTimePeriod, dateEndTimePeriod, topic)
        if (tempSearchString.isNotEmpty() && dateStartTimePeriod == null && dateEndTimePeriod == null && topic.isNullOrEmpty()) return repository.findAllByTitleLikeIgnoreCaseOrSenderLikeIgnoreCaseOrContentLikeIgnoreCase(tempSearchString, tempSearchString, tempSearchString)
        if (tempSearchString.isNullOrEmpty() && dateStartTimePeriod == null && dateEndTimePeriod == null && topic.isNotEmpty()) return repository.findAllByTopic(topic)
        if (tempSearchString.isNullOrEmpty() && dateStartTimePeriod != null && dateEndTimePeriod != null && topic.isEmpty()) return repository.findAllByStarttimeBetween(dateStartTimePeriod, dateEndTimePeriod)
        if (tempSearchString.isNullOrEmpty() && dateEndTimePeriod == null && dateStartTimePeriod == null && topic.isNullOrEmpty()) return repository.findAll() else return emptyList()
    }

    /**
     * REST-Endpoint for storing a new message.
     * See swagger definition of POST /message for more details.
     *
     * @param messageDto DTO of the message
     * @return Response Entity Containing Error Object in case of an invalid DTO
     */
    @PostMapping
    fun saveMessage(@RequestBody messageDto: MessageDTO): ResponseEntity<MessageBadRequestInfo> {

        val errors = messageDto.getErrors()
        if (errors != null) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(errors)
        }
        val message = messageDto.toEntity()

        if (message.starttime == null) {
            message.starttime = LocalDateTime.now()
            message.isSent = true
            messageService.sendMessage(message)
        } else {
            message.isSent = false
        }
        repository.save(message)
        return ResponseEntity.status(HttpStatus.OK).build()
    }

    @DeleteMapping("/{id}")
    fun deleteMessage(@PathVariable id: Long) {
        val message: Optional<Message> = repository.findById(id)

        if (message.isEmpty)
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find message with id $id.")

        if (message.get().isSent!!)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Already sent messages can't be deleted $id.")

        repository.deleteById(id)
    }
}
