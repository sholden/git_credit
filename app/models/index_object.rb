class IndexObject
  include ActiveAttr::Attributes
  include ActiveAttr::BasicModel
  include ActiveAttr::Serialization
  include ActiveAttr::MassAssignment

  attribute :path
  attribute :oid
  attribute :de
  attribute :in
  attribute :mode
  attribute :gi
  attribute :ui
  attribute :file_size
  attribute :valid
  attribute :stag
  attribute :ctime
  attribute :mtime
  attribute :language

  def self.build(repository)
    rugged = Rugged::Repository.new(repository.path)
    index = rugged.index

  end
end