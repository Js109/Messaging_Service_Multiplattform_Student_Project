package de.uulm.automotive.cds.models

import de.uulm.automotive.cds.entities.Token
import org.modelmapper.ModelMapper
import java.util.*

/**
 * Data transfer object (DTO) containing the queueid for the client.
 *
 * @property signUpToken Client generated UUID at signup (collision detection)
 * @property queueID QueueID of the client
 */
data class TokenDTO (
    val signUpToken: UUID,
    val queueID: UUID
)
{
    companion object {
        private val mapper: ModelMapper = ModelMapper()

        /**
         * Maps the Entity Token to the corresponding Data Transfer Object (DTO)
         *
         * @param token Token Entity
         * @return Mapped DTO
         */
        fun getTokenDTO(token: Token): TokenDTO {
            return mapper.map(token, TokenDTO::class.java)
        }
    }
}